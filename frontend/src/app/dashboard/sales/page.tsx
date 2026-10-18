"use client";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, CreditCard, Banknote, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Sale, Customer, SaleItem, Payment } from "@/lib/types";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  const [items, setItems] = useState<SaleItem[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Sale[]>("/sales/?limit=200").then(setSales).catch(() => {});
    api<Customer[]>("/customers/?limit=200").then(setCustomers).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSale) return;
    setLoadingDetails(true);
    Promise.all([
      api<SaleItem[]>(`/sale-items/sale/${selectedSale.id}`),
      api<Payment[]>(`/payments/sale/${selectedSale.id}`)
    ]).then(([fetchedItems, fetchedPayments]) => {
      setItems(fetchedItems);
      setPayment(fetchedPayments[0] || null);
      setLoadingDetails(false);
    }).catch((e) => {
      setError(e.message);
      setLoadingDetails(false);
    });
  }, [selectedSale]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((s) => 
      s.sale_number.toLowerCase().includes(q) ||
      (s.customer_id && customers.find(c => c.id === s.customer_id)?.first_name.toLowerCase().includes(q))
    );
  }, [sales, customers, query]);

  const getCustomerName = (id: string | null) => {
    if (!id) return "Walk in";
    const c = customers.find((c) => c.id === id);
    return c ? `${c.first_name} ${c.last_name}` : "Unknown";
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return "text-[var(--green)]";
    if (status === "pending") return "text-[var(--amber)]";
    return "text-[var(--text-muted)]";
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      <div className="flex-1 flex flex-col min-w-0 pr-8">
        <div className="flex items-end justify-between mb-8 shrink-0">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Sales</h1>
            <p className="text-sm text-[var(--text-muted)]">{sales.length} transactions recorded</p>
          </div>
        </div>

        <div className="relative group mb-6 shrink-0 max-w-md">
          <Search size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--brand-bright)] transition-colors" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by sale number or customer"
            className="w-full bg-transparent border-b border-[var(--border)] pl-8 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin">
          {error && <div className="text-sm text-[var(--red)] mb-4">{error}</div>}
          
          <div className="w-full">
            <div className="grid grid-cols-12 gap-4 pb-4 border-b border-[var(--border)] text-xs font-medium text-[var(--text-dim)]">
              <div className="col-span-4">Sale Number</div>
              <div className="col-span-4">Customer</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center text-sm text-[var(--text-dim)] py-12">No sales found</div>
            ) : (
              filtered.map((s) => (
                <button 
                  key={s.id} 
                  onClick={() => setSelectedSale(s)}
                  className="w-full grid grid-cols-12 gap-4 py-4 border-b border-[var(--border)] items-center hover:bg-[var(--surface-hover)] transition-colors text-sm rounded-lg px-2 -mx-2 text-left"
                >
                  <div className="col-span-4 mono text-[var(--brand-bright)]">{s.sale_number}</div>
                  <div className="col-span-4 truncate">{getCustomerName(s.customer_id)}</div>
                  <div className={`col-span-2 text-xs font-medium capitalize ${getStatusColor(s.status)}`}>
                    {s.status}
                  </div>
                  <div className="col-span-2 text-right tabular-nums font-medium">${Number(s.total_amount).toFixed(2)}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedSale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
            onClick={() => { setSelectedSale(null); setItems([]); setPayment(null); }}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-[var(--bg)] h-full shadow-2xl flex flex-col border-l border-[var(--border)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 flex items-center justify-between border-b border-[var(--border)] shrink-0">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Receipt</h2>
                  <div className="mono text-sm text-[var(--brand-bright)]">{selectedSale.sale_number}</div>
                </div>
                <button onClick={() => { setSelectedSale(null); setItems([]); setPayment(null); }} className="text-[var(--text-dim)] hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8">
                <div className="flex flex-col gap-6 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Date</span>
                    <span>{new Date(selectedSale.sale_date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Customer</span>
                    <span>{getCustomerName(selectedSale.customer_id)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Status</span>
                    <span className={`capitalize ${getStatusColor(selectedSale.status)}`}>{selectedSale.status}</span>
                  </div>
                </div>

                <div className="border-t border-[var(--border)] pt-6 mb-8">
                  <h3 className="text-xs font-medium text-[var(--text-dim)] mb-4">Items</h3>
                  {loadingDetails ? (
                    <div className="text-sm text-[var(--text-dim)]">Loading items...</div>
                  ) : items.length === 0 ? (
                    <div className="text-sm text-[var(--text-dim)]">No items found</div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start text-sm">
                          <div className="min-w-0 flex-1 pr-4">
                            <div className="truncate">Product ID: <span className="mono text-xs">{item.product_id.split("-")[0]}...</span></div>
                            <div className="text-xs text-[var(--text-dim)] mt-1">{item.quantity} x ${Number(item.unit_price).toFixed(2)}</div>
                          </div>
                          <div className="tabular-nums">${Number(item.total_price).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {payment && (
                  <div className="border-t border-[var(--border)] pt-6">
                    <h3 className="text-xs font-medium text-[var(--text-dim)] mb-4">Payment</h3>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        {payment.payment_method === "cash" ? <Banknote size={16} /> : <CreditCard size={16} />}
                        <span className="capitalize">{payment.payment_method.replace("-", " ")}</span>
                      </div>
                      <span className="text-[var(--green)] flex items-center gap-1.5 text-xs">
                        <CheckCircle2 size={14} /> Paid
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-[var(--border)] shrink-0">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm text-[var(--text-muted)]">Subtotal</span>
                  <span className="tabular-nums">${Number(selectedSale.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-sm text-[var(--text-muted)]">Tax</span>
                  <span className="tabular-nums">${Number(selectedSale.tax_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-4 border-t border-[var(--border)]">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-2xl font-bold tabular-nums">${Number(selectedSale.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
