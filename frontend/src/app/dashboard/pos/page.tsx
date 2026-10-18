"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Minus, X, ShoppingCart, CheckCircle2, CreditCard, Banknote, Receipt,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Product, Customer, Sale } from "@/lib/types";

type Line = { product: Product; qty: number };

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [payMethod, setPayMethod] = useState("credit-card");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{ sale: Sale; receiptNumber: string; total: number } | null>(null);

  useEffect(() => {
    api<Product[]>("/products/?limit=200").then(setProducts).catch(() => {});
    api<Customer[]>("/customers/?limit=200").then(setCustomers).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [products, query]);

  const subtotal = lines.reduce((a, l) => a + Number(l.product.price) * l.qty, 0);
  const total = subtotal;

  function add(p: Product) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === p.id);
      if (existing) {
        if (existing.qty + 1 > p.quantity_in_stock) return prev;
        return prev.map((l) => (l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { product: p, qty: 1 }];
    });
  }

  function dec(id: string) {
    setLines((prev) =>
      prev.map((l) => (l.product.id === id ? { ...l, qty: l.qty - 1 } : l)).filter((l) => l.qty > 0)
    );
  }

  function inc(id: string) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.product.id !== id) return l;
        if (l.qty + 1 > l.product.quantity_in_stock) return l;
        return { ...l, qty: l.qty + 1 };
      })
    );
  }

  function clear() {
    setLines([]);
    setCustomerId("");
    setError("");
  }

  async function checkout() {
    if (lines.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const saleNumber = `SAL-${Date.now()}`;
      const sale = await api<Sale>("/sales/", {
        method: "POST",
        body: JSON.stringify({
          sale_number: saleNumber,
          sale_date: new Date().toISOString(),
          subtotal: subtotal.toFixed(2),
          tax_amount: "0.00",
          discount_amount: "0.00",
          total_amount: total.toFixed(2),
          status: "pending",
          customer_id: customerId || null,
        }),
      });

      for (const l of lines) {
        await api("/sale-items/", {
          method: "POST",
          body: JSON.stringify({
            quantity: String(l.qty),
            unit_price: Number(l.product.price).toFixed(2),
            discount_amount: "0.00",
            tax_amount: "0.00",
            total_price: (Number(l.product.price) * l.qty).toFixed(2),
            sale_id: sale.id,
            product_id: l.product.id,
          }),
        });
      }

      await api("/payments/", {
        method: "POST",
        body: JSON.stringify({
          amount: total.toFixed(2),
          payment_method: payMethod,
          payment_status: "completed",
          paid_at: new Date().toISOString(),
          transaction_reference: `TXN-${Date.now()}`,
          sale_id: sale.id,
        }),
      });

      const receiptNumber = `RCT-${Date.now()}`;
      await api("/receipts/", {
        method: "POST",
        body: JSON.stringify({
          receipt_number: receiptNumber,
          receipt_data: {
            sale_number: sale.sale_number,
            items: lines.map((l) => ({ name: l.product.name, qty: l.qty, price: l.product.price })),
            total: total.toFixed(2),
          },
          receipt_type: "digital",
          issued_at: new Date().toISOString(),
          sale_id: sale.id,
        }),
      });

      await api(`/sales/${sale.id}/status?status=completed`, { method: "PATCH" });

      setReceipt({ sale, receiptNumber, total });
      clear();
      api<Product[]>("/products/?limit=200").then(setProducts).catch(() => {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-[calc(100vh-80px)] flex gap-12">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-8">New sale</h1>
          <div className="relative group">
            <Search size={20} className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--brand-bright)] transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              autoFocus
              className="w-full bg-transparent border-b border-[var(--border)] pl-9 pr-4 py-3 text-lg focus:outline-none focus:border-[var(--brand)] transition-colors placeholder:text-[var(--text-dim)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin pb-10">
          {filtered.length === 0 ? (
            <div className="text-center text-sm text-[var(--text-dim)] py-20">
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((p) => {
                const inCart = lines.find((l) => l.product.id === p.id);
                const disabled = p.quantity_in_stock === 0 || (inCart && inCart.qty >= p.quantity_in_stock);
                return (
                  <button
                    key={p.id}
                    onClick={() => add(p)}
                    disabled={disabled}
                    className={`flex flex-col text-left p-5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border)] ${
                      inCart ? "border-[var(--brand)]" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3 w-full">
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-medium truncate">{p.name}</div>
                        <div className="text-xs mono text-[var(--text-dim)] truncate mt-0.5">{p.sku}</div>
                      </div>
                      {inCart && (
                        <span className="text-xs px-2 py-0.5 bg-[var(--brand)] text-white rounded-full tabular-nums shrink-0 ml-2">
                          {inCart.qty}
                        </span>
                      )}
                    </div>
                    <div className="flex items-end justify-between w-full mt-4">
                      <div className="text-xl font-semibold text-[var(--brand-bright)] tabular-nums">
                        ${Number(p.price).toFixed(2)}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] tabular-nums">
                        {p.quantity_in_stock} left
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="w-[400px] shrink-0 flex flex-col pt-2">
        <div className="mb-8">
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full bg-transparent border-b border-[var(--border)] py-2 text-sm text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] transition-colors cursor-pointer"
          >
            <option value="">Walk in customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}{c.medical_record_number ? ` (${c.medical_record_number})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
              <ShoppingCart size={32} className="mb-4" />
              <div className="text-sm">Cart is empty</div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {lines.map((l) => (
                <div key={l.product.id} className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{l.product.name}</div>
                    </div>
                    <button onClick={() => setLines((p) => p.filter((x) => x.product.id !== l.product.id))} className="text-[var(--text-dim)] hover:text-[var(--red)] transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-[var(--surface)] rounded-full px-2 py-1">
                      <button onClick={() => dec(l.product.id)} className="w-5 h-5 flex items-center justify-center hover:text-white text-[var(--text-muted)] transition-colors">
                        <Minus size={12} />
                      </button>
                      <div className="w-4 text-center text-xs tabular-nums">{l.qty}</div>
                      <button onClick={() => inc(l.product.id)} className="w-5 h-5 flex items-center justify-center hover:text-white text-[var(--text-muted)] transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="text-sm tabular-nums text-[var(--text-muted)]">${(Number(l.product.price) * l.qty).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-6 mt-auto">
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex justify-between text-sm text-[var(--text-muted)]">
              <span>Subtotal</span>
              <span className="tabular-nums">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-4 border-t border-[var(--border)]">
              <span className="text-sm text-[var(--text-muted)]">Total</span>
              <span className="text-3xl font-bold tabular-nums tracking-tight">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            {[
              { id: "cash", label: "Cash", icon: Banknote },
              { id: "credit-card", label: "Card", icon: CreditCard },
              { id: "insurance-claim", label: "Insurance", icon: Receipt },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPayMethod(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs transition-colors rounded-lg ${
                  payMethod === id
                    ? "bg-[var(--surface)] text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {error && <div className="text-xs text-[var(--red)] mb-4 text-center">{error}</div>}

          <button
            onClick={checkout}
            disabled={lines.length === 0 || busy}
            className="w-full py-4 text-sm font-semibold bg-[var(--brand)] hover:bg-[var(--brand-bright)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center"
          >
            {busy ? "Processing" : "Charge"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {receipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setReceipt(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="surface glow-blue max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-[var(--green)]/10 flex items-center justify-center mb-6">
                  <CheckCircle2 size={32} className="text-[var(--green)]" />
                </div>
                <div className="text-2xl font-bold tracking-tight mb-2">Sale complete</div>
                <div className="text-sm text-[var(--text-muted)]">Transaction processed</div>
              </div>
              <div className="px-8 pb-8 flex flex-col gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Receipt</span>
                  <span className="mono">{receipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Method</span>
                  <span className="capitalize">{payMethod.replace("-", " ")}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-[var(--border)] items-baseline">
                  <span className="text-[var(--text-muted)]">Charged</span>
                  <span className="font-bold text-2xl text-[var(--green)] tabular-nums">${receipt.total.toFixed(2)}</span>
                </div>
              </div>
              <div className="p-4">
                <button
                  onClick={() => setReceipt(null)}
                  className="w-full py-3 text-sm font-medium bg-[var(--surface-hover)] hover:bg-[var(--border)] transition-colors rounded-lg"
                >
                  New sale
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
