import uuid
import pytest
from app.core.security import create_access_token

def _reg(**overrides):
    u = uuid.uuid4().hex[:8]
    data = {
        "username": f"user_{u}",
        "email": f"u_{u}@test.com",
        "password": "StrongPass123!",
        "first_name": "Test",
        "last_name": "User",
        "role": "cashier",
    }
    data.update(overrides)
    return data

def test_register_requires_admin(client):
    r = client.post("/auth/register", json=_reg())
    assert r.status_code == 401

def test_register_returns_201_and_id(client, auth_headers):
    r = client.post("/auth/register", json=_reg(), headers=auth_headers)
    assert r.status_code == 201
    body = r.json()
    assert uuid.UUID(body["id"])
    assert body["is_active"] is True
    assert "created_at" in body

def test_register_never_leaks_password(client, auth_headers):
    r = client.post("/auth/register", json=_reg(), headers=auth_headers)
    body = r.json()
    assert "password" not in body
    assert "password_hash" not in body
    assert "hashed_password" not in body

def test_register_persists_hashed_password(client, db_session, auth_headers):
    p = _reg()
    client.post("/auth/register", json=p, headers=auth_headers)
    from app.models.user import User
    u = db_session.query(User).filter_by(username=p["username"]).first()
    assert u is not None
    assert u.password_hash != p["password"]
    assert u.password_hash.startswith("$2")

@pytest.mark.parametrize("bad_email", ["not-an-email", "no@at", "@nodomain.com", "spaces in@email.com", ""])
def test_register_rejects_bad_email(client, bad_email, auth_headers):
    r = client.post("/auth/register", json=_reg(email=bad_email), headers=auth_headers)
    assert r.status_code == 422

@pytest.mark.parametrize("bad_pwd", ["", "123", "short", "a" * 7])
def test_register_rejects_weak_password(client, bad_pwd, auth_headers):
    r = client.post("/auth/register", json=_reg(password=bad_pwd), headers=auth_headers)
    assert r.status_code == 422

@pytest.mark.parametrize("bad_role", ["superuser", "doctor", "", "ADMIN"])
def test_register_rejects_invalid_role(client, bad_role, auth_headers):
    r = client.post("/auth/register", json=_reg(role=bad_role), headers=auth_headers)
    assert r.status_code == 422

def test_register_duplicate_username_case_sensitive(client, cashier_user, auth_headers):
    r = client.post("/auth/register", json=_reg(username=cashier_user.username), headers=auth_headers)
    assert r.status_code == 400
    assert "username" in r.json()["detail"].lower()

def test_register_duplicate_email(client, cashier_user, auth_headers):
    r = client.post("/auth/register", json=_reg(email=cashier_user.email), headers=auth_headers)
    assert r.status_code == 400

def test_login_returns_both_tokens(client, cashier_user):
    r = client.post("/auth/login", data={"username": cashier_user.username, "password": "Pass123!"})
    assert r.status_code == 200
    b = r.json()
    assert b["token_type"] == "bearer"
    assert b["access_token"] != b["refresh_token"]
    assert b["expires_in"] > 0
    assert b["user"]["id"] == str(cashier_user.id)
    assert b["user"]["role"] == "cashier"

def test_login_updates_last_login(client, cashier_user, db_session):
    before = cashier_user.last_login
    client.post("/auth/login", data={"username": cashier_user.username, "password": "Pass123!"})
    db_session.refresh(cashier_user)
    assert cashier_user.last_login is not None
    if before is not None:
        assert cashier_user.last_login >= before

def test_login_wrong_password_returns_401(client, cashier_user):
    r = client.post("/auth/login", data={"username": cashier_user.username, "password": "wrong"})
    assert r.status_code == 401
    assert "WWW-Authenticate" in r.headers

def test_login_unknown_user_returns_401(client):
    r = client.post("/auth/login", data={"username": "ghost", "password": "x"})
    assert r.status_code == 401

def test_login_inactive_user_returns_403(client, inactive_user):
    r = client.post("/auth/login", data={"username": inactive_user.username, "password": "Pass123!"})
    assert r.status_code == 403

def test_login_identical_error_for_bad_user_and_bad_password(client, cashier_user):
    r1 = client.post("/auth/login", data={"username": "ghost", "password": "x"})
    r2 = client.post("/auth/login", data={"username": cashier_user.username, "password": "x"})
    assert r1.status_code == r2.status_code == 401
    assert r1.json()["detail"] == r2.json()["detail"]

def test_refresh_returns_new_tokens(client, cashier_user):
    login = client.post("/auth/login", data={"username": cashier_user.username, "password": "Pass123!"}).json()
    r = client.post("/auth/refresh", params={"refresh_token": login["refresh_token"]})
    assert r.status_code == 200
    assert r.json()["access_token"] != login["access_token"]

def test_refresh_rejects_access_token(client, cashier_user):
    login = client.post("/auth/login", data={"username": cashier_user.username, "password": "Pass123!"}).json()
    r = client.post("/auth/refresh", params={"refresh_token": login["access_token"]})
    assert r.status_code in (400, 401)

def test_refresh_rejects_garbage(client):
    r = client.post("/auth/refresh", params={"refresh_token": "not.a.jwt"})
    assert r.status_code in (400, 401)

def test_access_token_has_correct_claims(cashier_user):
    from app.core.security import decode_access_token
    token = create_access_token(str(cashier_user.id))
    payload = decode_access_token(token)
    assert payload["sub"] == str(cashier_user.id)
    assert "exp" in payload and "iat" in payload
    assert payload["exp"] > payload["iat"]
