"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp, ShoppingBag, Users, Package, AlertTriangle, ArrowUpRight, Clock, Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Sale, Product, Customer } from "@/lib/types";
import { getUser } from "@/lib/auth";

export default function Overview() {
  const role = getUser()?.role || "";
  const canSeeStock = ["admin", "inventory-manager", "pharmacist"].includes(role);

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);

  useEffect(() => {
    api<Sale[]>("/sales/?limit=200").then(setSales).catch(() => {});
    api<Product[]>("/products/?limit=200").then(setProducts).catch(() => {});
    api<Customer[]>("/customers/?limit=200").then(setCustomers).catch(() => {});
    
    if (canSeeStock) {
      api<Product[]>("/products/low-stock").then(setLowStock).catch(() => {});
    }
  }, [canSeeStock]);

  const revenue = sales.reduce((a, s) => a + Number(s.total_amount || 0), 0);
  const today = sales.filter((s) => new Date(s.sale_date).toDateString() === new Date().toDateString());
  const todayRevenue = today.reduce((a, s) => a + Number(s.total_amount || 0), 0);
  const stockValue = products.reduce((a, p) => a + Number(p.price) * p.quantity_in_stock, 0);
  const maxSale = Math.max(1, ...sales.map((s) => Number(s.total_amount)));

  const recent = [...sales].sort((a, b) => +new Date(b.sale_date) - +new Date(a.sale_date)).slice(0, 8);

  const kpis = [
    { label: "Revenue total", value: `$${revenue.toFixed(2)}`, delta: `$${todayRevenue.toFixed(2)} today`, icon: TrendingUp, tint: "var(--green)" },
    { label: "Transactions", value: sales.length.toString(), delta: `${today.length} today`, icon: ShoppingBag, tint: "var(--brand-bright)" },
    { label: "Customers", value: customers.length.toString(), delta: "active profiles", icon: Users, tint: "var(--cyan)" },
    { label: "Stock value", value: `$${stockValue.toFixed(0)}`, delta: `${products.length} SKUs`, icon: Package, tint: "var(--amber)" },
  ];

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Overview</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}. All systems nominal.
            </p>
          </div>
          <Link href="/dashboard/pos" className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[var(--brand)] hover:bg-[var(--brand-bright)] transition-colors rounded-lg glow-blue">
            <Plus size={16} /> New sale
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {kpis.map(({ label, value, delta, icon: Icon, tint }) => (
            <div key={label} className="surface p-5 relative overflow-hidden group hover:border-[var(--border-strong)] transition-colors">
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: tint }} />
              <div className="flex items-start justify-between mb-3 relative">
                <div className="text-sm text-[var(--text-muted)]">{label}</div>
                <Icon size={16} style={{ color: tint }} />
              </div>
              <div className="text-3xl font-semibold tabular-nums relative">{value}</div>
              <div className="text-xs text-[var(--text-muted)] mt-2 relative">{delta}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5 mb-5">
          <div className={`${canSeeStock ? "col-span-2" : "col-span-3"} surface p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm font-medium text-white">Revenue by transaction</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Last {recent.length} transactions</div>
              </div>
              <div className="text-xs text-[var(--text-dim)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--brand-bright)] animate-pulse" />
                Live
              </div>
            </div>
            <div className="flex items-stretch gap-2 h-44">
              {recent.length === 0 ? (
                <div className="text-sm text-[var(--text-dim)] w-full text-center py-12">No transactions yet</div>
              ) : (
                [...recent].reverse().map((s) => {
                  const pct = (Number(s.total_amount) / maxSale) * 100;
                  return (
                    <div key={s.id} className="flex-1 flex flex-col justify-end items-center gap-2 group cursor-default">
                      <div className="text-xs text-[var(--text-dim)] opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                        ${Number(s.total_amount).toFixed(0)}
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-[var(--brand)] to-[var(--brand-bright)] hover:from-[var(--brand-bright)] hover:to-[var(--cyan)] transition-all rounded-t-sm"
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {canSeeStock && (
            <div className="surface p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-medium text-white">Low stock alerts</div>
                <AlertTriangle size={16} className={lowStock.length > 0 ? "text-[var(--amber)]" : "text-[var(--text-dim)]"} />
              </div>
              {lowStock.length === 0 ? (
                <div className="text-sm text-[var(--text-dim)] py-10 text-center">All products are above reorder level</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {lowStock.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <div className="truncate">{p.name}</div>
                        <div className="text-xs text-[var(--text-dim)] mono">{p.sku}</div>
                      </div>
                      <div className="text-[var(--amber)] tabular-nums shrink-0">{p.quantity_in_stock} of {p.reorder_level}</div>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/dashboard/inventory" className="mt-6 flex items-center gap-1 text-sm text-[var(--brand-bright)] hover:text-white transition-colors">
                View inventory <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 surface">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Recent transactions</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Latest activity across the pharmacy</div>
              </div>
              <Link href="/dashboard/sales" className="text-sm text-[var(--brand-bright)] hover:text-white flex items-center gap-1">
                All sales <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] text-xs text-[var(--text-dim)]">
                <div className="col-span-4">Sale</div>
                <div className="col-span-3">Time</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3 text-right">Amount</div>
              </div>
              {recent.length === 0 ? (
                <div className="text-sm text-[var(--text-dim)] py-12 text-center">No transactions recorded</div>
              ) : (
                recent.slice(0, 6).map((s) => (
                  <div key={s.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-hover)] transition-colors text-sm items-center">
                    <div className="col-span-4 mono text-[var(--brand-bright)] truncate">{s.sale_number}</div>
                    <div className="col-span-3 text-[var(--text-muted)] flex items-center gap-1.5">
                      <Clock size={12} /> {new Date(s.sale_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="col-span-2">
                      <span className={`text-xs px-2 py-1 rounded-full border ${
                        s.status === "completed" ? "text-[var(--green)] border-[var(--green)]/30 bg-[var(--green)]/5" :
                        s.status === "pending" ? "text-[var(--amber)] border-[var(--amber)]/30 bg-[var(--amber)]/5" :
                        "text-[var(--text-muted)] border-[var(--border)]"
                      }`}>{s.status}</span>
                    </div>
                    <div className="col-span-3 text-right tabular-nums font-medium">${Number(s.total_amount).toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="surface p-6">
            <div className="text-sm font-medium text-white mb-5">Activity feed</div>
            <div className="flex flex-col gap-4">
              {recent.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-[var(--brand-bright)] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[var(--text)] truncate">Sale <span className="mono text-[var(--brand-bright)]">{s.sale_number}</span> recorded</div>
                    <div className="text-xs text-[var(--text-dim)]">
                      {new Date(s.sale_date).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
              {canSeeStock && lowStock.length > 0 && (
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-[var(--amber)] mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div>{lowStock.length} product{lowStock.length > 1 ? "s" : ""} below reorder level</div>
                    <div className="text-xs text-[var(--text-dim)]">Needs restocking</div>
                  </div>
                </div>
              )}
              {recent.length === 0 && (!canSeeStock || lowStock.length === 0) && (
                <div className="text-sm text-[var(--text-dim)] py-4">No activity yet</div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
