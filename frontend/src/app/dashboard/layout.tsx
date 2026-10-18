"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, ShoppingCart, Package, Users, Receipt, Truck, UserCog,
  LogOut, Search, Bell, ChevronRight,
} from "lucide-react";
import { getUser, clearAuth, getToken, AuthUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["admin", "pharmacist", "cashier", "inventory-manager", "pharmacy-technician"] },
  { href: "/dashboard/pos", label: "Point of Sale", icon: ShoppingCart, roles: ["admin", "pharmacist", "cashier", "pharmacy-technician"] },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package, roles: ["admin", "inventory-manager", "pharmacist"] },
  { href: "/dashboard/sales", label: "Sales", icon: Receipt, roles: ["admin", "pharmacist", "cashier"] },
  { href: "/dashboard/customers", label: "Customers", icon: Users, roles: ["admin", "pharmacist", "cashier", "pharmacy-technician"] },
  { href: "/dashboard/suppliers", label: "Suppliers", icon: Truck, roles: ["admin", "inventory-manager"] },
  { href: "/dashboard/users", label: "Users", icon: UserCog, roles: ["admin"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [lowStock, setLowStock] = useState(0);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const token = getToken();
    const currentUser = getUser();
    
    if (!token || !currentUser) {
      clearAuth();
      router.replace("/login");
      return;
    }

    setUser(currentUser);
    
    const allowedRoute = NAV.find((n) => n.href === pathname);
    if (allowedRoute && !allowedRoute.roles.includes(currentUser.role)) {
      router.replace("/dashboard");
      return;
    }

    setReady(true);
    api<unknown[]>("/products/low-stock").then((d) => setLowStock(d.length)).catch(() => {});
    api<unknown[]>("/sales/status/pending").then((d) => setPending(d.length)).catch(() => {});
  }, [router, pathname]);

  if (!ready || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-sm text-[var(--text-dim)]">Loading</div>
      </div>
    );
  }

  const counts: Record<string, number> = {
    "/dashboard/inventory": lowStock,
    "/dashboard/sales": pending,
  };

  const allowedNav = NAV.filter((n) => n.roles.includes(user.role));
  const active = allowedNav.find((n) => pathname === n.href) || allowedNav[0];

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <aside className="w-[260px] shrink-0 flex flex-col p-6">
        <div className="mb-12">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Logo className="w-6 h-6 text-[var(--brand-bright)]" />
            <div className="text-xl font-semibold tracking-tight">Meridian</div>
          </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <div className="text-xs font-medium text-[var(--text-dim)] mb-2 px-3">Workspace</div>
          {allowedNav.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            const count = counts[href] || 0;
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors relative ${
                  isActive
                    ? "text-white bg-[var(--surface)]"
                    : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-hover)]"
                }`}
              >
                <Icon size={18} className={isActive ? "text-[var(--brand-bright)]" : "opacity-70 group-hover:opacity-100"} />
                <span className="flex-1 font-medium">{label}</span>
                {count > 0 && (
                  <span className="text-xs text-[var(--brand-bright)] tabular-nums">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 mt-auto">
          <div className="flex items-center gap-3 mb-6 px-3">
            <div className="w-9 h-9 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-xs font-semibold text-[var(--brand-bright)]">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.first_name} {user.last_name}</div>
              <div className="text-xs text-[var(--text-dim)] truncate capitalize">{user.role.replace("-", " ")}</div>
            </div>
          </div>
          <button
            onClick={() => { clearAuth(); router.replace("/login"); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 flex items-center px-10 gap-4 shrink-0">
          <div className="flex items-center gap-3 text-sm text-[var(--text-dim)]">
            <span>Meridian</span>
            <ChevronRight size={14} className="opacity-50" />
            <span className="text-white font-medium">{active?.label}</span>
          </div>
          <div className="flex-1" />
          <div className="relative hidden md:block group">
            <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--brand-bright)] transition-colors" />
            <input
              placeholder="Search"
              className="bg-transparent border-b border-[var(--border)] pl-7 pr-4 py-2 text-sm w-[240px] focus:outline-none focus:border-[var(--brand)] transition-colors"
            />
          </div>
          <button className="relative w-10 h-10 flex items-center justify-center hover:bg-[var(--surface-hover)] rounded-full transition-colors">
            <Bell size={18} className="text-[var(--text-muted)]" />
            {pending > 0 && <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[var(--red)]" />}
          </button>
        </header>
        <main className="flex-1 overflow-y-auto scroll-thin relative px-10 pb-10">{children}</main>
      </div>
    </div>
  );
}
