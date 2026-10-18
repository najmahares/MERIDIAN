"use client";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import type { UserRow } from "@/lib/types";

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  
  const [form, setForm] = useState({
    username: "", email: "", password: "", first_name: "", last_name: "", role: "cashier"
  });

  async function load() {
    try {
      const data = await api<UserRow[]>("/users/?limit=200");
      setUsers(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => 
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) || 
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/users/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setShowCreate(false);
      setForm({ username: "", email: "", password: "", first_name: "", last_name: "", role: "cashier" });
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-80px)]">
      <div className="flex-1 flex flex-col min-w-0 pr-8">
        <div className="flex items-end justify-between mb-8 shrink-0">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Users</h1>
            <p className="text-sm text-[var(--text-muted)]">{users.length} staff accounts</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[var(--brand)] hover:bg-[var(--brand-bright)] transition-colors text-white rounded-lg">
            <Plus size={16} /> New user
          </button>
        </div>

        <div className="relative group mb-6 shrink-0 max-w-md">
          <Search size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--brand-bright)] transition-colors" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, username, or email"
            className="w-full bg-transparent border-b border-[var(--border)] pl-8 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin">
          <div className="w-full">
            <div className="grid grid-cols-12 gap-4 pb-4 border-b border-[var(--border)] text-xs font-medium text-[var(--text-dim)]">
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Username</div>
              <div className="col-span-3">Role</div>
              <div className="col-span-3 text-right">Status</div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center text-sm text-[var(--text-dim)] py-12">No users found</div>
            ) : (
              filtered.map((u) => (
                <div key={u.id} className="grid grid-cols-12 gap-4 py-4 border-b border-[var(--border)] items-center hover:bg-[var(--surface-hover)] transition-colors text-sm rounded-lg px-2 -mx-2">
                  <div className="col-span-3 font-medium truncate">{u.first_name} {u.last_name}</div>
                  <div className="col-span-3 text-[var(--text-muted)] truncate">{u.username}</div>
                  <div className="col-span-3 text-[var(--text-muted)] capitalize truncate">{u.role.replace("-", " ")}</div>
                  <div className="col-span-3 flex justify-end">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? "text-[var(--green)] bg-[var(--green)]/10" : "text-[var(--red)] bg-[var(--red)]/10"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-md bg-[var(--bg)] h-full shadow-2xl flex flex-col border-l border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
              <div className="p-8 flex items-center justify-between border-b border-[var(--border)]">
                <h2 className="text-2xl font-bold">New user</h2>
                <button onClick={() => setShowCreate(false)} className="text-[var(--text-dim)] hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <form id="create-user" onSubmit={submit} className="flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-2">First name</label>
                      <input required value={form.first_name} onChange={(e) => setForm({...form, first_name: e.target.value})} className="w-full bg-[var(--bg)] text-white border-b border-[var(--border)] py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-2">Last name</label>
                      <input required value={form.last_name} onChange={(e) => setForm({...form, last_name: e.target.value})} className="w-full bg-[var(--bg)] text-white border-b border-[var(--border)] py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-2">Username</label>
                    <input required value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} className="w-full bg-[var(--bg)] text-white border-b border-[var(--border)] py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-2">Email</label>
                    <input required type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full bg-[var(--bg)] text-white border-b border-[var(--border)] py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-2">Password</label>
                    <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="w-full bg-[var(--bg)] text-white border-b border-[var(--border)] py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-2">Role</label>
                    <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="w-full bg-[var(--bg)] border-b border-[var(--border)] py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors cursor-pointer capitalize">
                      <option value="admin">Admin</option>
                      <option value="pharmacist">Pharmacist</option>
                      <option value="pharmacy-technician">Pharmacy technician</option>
                      <option value="cashier">Cashier</option>
                      <option value="inventory-manager">Inventory manager</option>
                    </select>
                  </div>
                </form>
              </div>
              <div className="p-8 border-t border-[var(--border)]">
                {error && <div className="text-sm text-[var(--red)] mb-4">{error}</div>}
                <button form="create-user" type="submit" disabled={busy} className="w-full py-4 text-sm font-semibold bg-[var(--brand)] hover:bg-[var(--brand-bright)] transition-colors disabled:opacity-50 text-white rounded-xl flex items-center justify-center">
                  {busy ? "Creating..." : "Create user"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
