"use client";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, AlertTriangle, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Product, Category, Supplier } from "@/lib/types";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    name: "", sku: "", price: "", cost: "", quantity_in_stock: "", reorder_level: "",
    category_id: "", supplier_id: "",
  });

  async function load() {
    try {
      const [p, c, s] = await Promise.all([
        api<Product[]>("/products/?limit=200"),
        api<Category[]>("/categories/?limit=100"),
        api<Supplier[]>("/suppliers/?limit=100"),
      ]);
      setProducts(p);
      setCategories(c);
      setSuppliers(s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, query]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/products/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          price: String(form.price || "0"),
          cost: String(form.cost || "0"),
          quantity_in_stock: Number(form.quantity_in_stock || 0),
          reorder_level: Number(form.reorder_level || 0),
          category_id: form.category_id || null,
          supplier_id: form.supplier_id || null,
        }),
      });
      setShowCreate(false);
      setForm({ name: "", sku: "", price: "", cost: "", quantity_in_stock: "", reorder_level: "", category_id: "", supplier_id: "" });
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
            <h1 className="text-4xl font-bold tracking-tight mb-2">Inventory</h1>
            <p className="text-sm text-[var(--text-muted)]">{products.length} total products</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[var(--brand)] hover:bg-[var(--brand-bright)] transition-colors text-white rounded-lg"
          >
            <Plus size={16} /> New product
          </button>
        </div>

        <div className="relative group mb-6 shrink-0 max-w-md">
          <Search size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--brand-bright)] transition-colors" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search inventory"
            className="w-full bg-transparent border-b border-[var(--border)] pl-8 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin">
          {error && <div className="text-sm text-[var(--red)] mb-4">{error}</div>}
          
          <div className="w-full">
            <div className="grid grid-cols-12 gap-4 pb-4 border-b border-[var(--border)] text-xs font-medium text-[var(--text-dim)]">
              <div className="col-span-4">Product</div>
              <div className="col-span-2">SKU</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Stock</div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center text-sm text-[var(--text-dim)] py-12">No products found</div>
            ) : (
              filtered.map((p) => {
                const isLow = p.quantity_in_stock <= p.reorder_level;
                const categoryName = categories.find((c) => c.id === p.category_id)?.name || "None";

                return (
                  <div key={p.id} className="grid grid-cols-12 gap-4 py-4 border-b border-[var(--border)] items-center hover:bg-[var(--surface-hover)] transition-colors text-sm rounded-lg px-2 -mx-2">
                    <div className="col-span-4 font-medium truncate">{p.name}</div>
                    <div className="col-span-2 mono text-[var(--text-muted)] text-xs">{p.sku}</div>
                    <div className="col-span-2 text-[var(--text-muted)] text-xs truncate">{categoryName}</div>
                    <div className="col-span-2 text-right tabular-nums text-[var(--text-muted)]">${Number(p.price).toFixed(2)}</div>
                    <div className="col-span-2 flex items-center justify-end gap-2 tabular-nums">
                      {isLow && <AlertTriangle size={14} className="text-[var(--amber)]" />}
                      <span className={isLow ? "text-[var(--amber)]" : ""}>{p.quantity_in_stock}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-[var(--bg)] h-full shadow-2xl flex flex-col border-l border-[var(--border)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 flex items-center justify-between border-b border-[var(--border)]">
                <h2 className="text-2xl font-bold">New product</h2>
                <button onClick={() => setShowCreate(false)} className="text-[var(--text-dim)] hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8">
                <form id="create-product" onSubmit={submit} className="flex flex-col gap-6">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-2">Name</label>
                    <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full bg-[var(--bg)] text-white border-b border-[var(--border)] py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-2">SKU</label>
                    <input required value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="w-full bg-[var(--bg)] text-white border-b border-[var(--border)] py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-2">Price</label>
                      <input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} className="w-full bg-[var(--bg)] text-white border-b border-[var(--border)] py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-2">Cost</label>
                      <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({...form, cost: e.target.value})} className="w-full bg-[var(--bg)] text-white border-b border-[var(--border)] py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-2">Stock</label>
                      <input required type="number" value={form.quantity_in_stock} onChange={(e) => setForm({...form, quantity_in_stock: e.target.value})} className="w-full bg-[var(--bg)] text-white border-b border-[var(--border)] py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-2">Reorder level</label>
                      <input required type="number" value={form.reorder_level} onChange={(e) => setForm({...form, reorder_level: e.target.value})} className="w-full bg-[var(--bg)] text-white border-b border-[var(--border)] py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-2">Category</label>
                    <select value={form.category_id} onChange={(e) => setForm({...form, category_id: e.target.value})} className="w-full bg-[var(--bg)] border-b border-[var(--border)] py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors cursor-pointer">
                      <option value="">Select a category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-2">Supplier</label>
                    <select value={form.supplier_id} onChange={(e) => setForm({...form, supplier_id: e.target.value})} className="w-full bg-[var(--bg)] border-b border-[var(--border)] py-2 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors cursor-pointer">
                      <option value="">Select a supplier</option>
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                    </select>
                  </div>
                </form>
              </div>

              <div className="p-8 border-t border-[var(--border)]">
                {error && <div className="text-sm text-[var(--red)] mb-4">{error}</div>}
                <button
                  form="create-product"
                  type="submit"
                  disabled={busy}
                  className="w-full py-4 text-sm font-semibold bg-[var(--brand)] hover:bg-[var(--brand-bright)] transition-colors disabled:opacity-50 text-white rounded-xl flex items-center justify-center"
                >
                  {busy ? "Creating..." : "Create product"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
