export const MOCK_PRODUCTS = [
  { id: "1", name: "Amoxicillin 500mg", sku: "AMOX-500", price: "12.50", cost: "6.00", quantity_in_stock: 450, reorder_level: 50, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_id: null, supplier_id: null, barcode: null, description: null, expiry_date: null },
  { id: "2", name: "Paracetamol 500mg", sku: "PARA-500", price: "4.50", cost: "2.00", quantity_in_stock: 1120, reorder_level: 100, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_id: null, supplier_id: null, barcode: null, description: null, expiry_date: null },
  { id: "3", name: "Ibuprofen 400mg", sku: "IBU-400", price: "6.00", cost: "3.00", quantity_in_stock: 800, reorder_level: 80, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_id: null, supplier_id: null, barcode: null, description: null, expiry_date: null },
  { id: "4", name: "Lisinopril 10mg", sku: "LIS-10", price: "15.00", cost: "7.50", quantity_in_stock: 30, reorder_level: 50, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_id: null, supplier_id: null, barcode: null, description: null, expiry_date: null },
  { id: "5", name: "Atorvastatin 20mg", sku: "ATO-20", price: "22.00", cost: "10.00", quantity_in_stock: 200, reorder_level: 40, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_id: null, supplier_id: null, barcode: null, description: null, expiry_date: null }
];

export const MOCK_CUSTOMERS = [
  { id: "c1", first_name: "Jane", last_name: "Doe", email: "jane@example.com", phone: "555-0100", address: null, date_of_birth: null, medical_record_number: "MRN-1001", insurance_provider: null, insurance_policy_number: null, is_active: true, created_at: new Date().toISOString() },
  { id: "c2", first_name: "John", last_name: "Smith", email: "john@example.com", phone: "555-0101", address: null, date_of_birth: null, medical_record_number: "MRN-1002", insurance_provider: null, insurance_policy_number: null, is_active: true, created_at: new Date().toISOString() },
  { id: "c3", first_name: "Emily", last_name: "Davis", email: "emily@example.com", phone: "555-0102", address: null, date_of_birth: null, medical_record_number: "MRN-1003", insurance_provider: null, insurance_policy_number: null, is_active: true, created_at: new Date().toISOString() }
];

export const MOCK_SALES = Array.from({ length: 8 }).map((_, i) => ({
  id: `s${i}`,
  sale_number: `SAL-100${i}`,
  sale_date: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
  subtotal: (Math.random() * 50 + 10).toFixed(2),
  tax_amount: "0.00",
  discount_amount: "0.00",
  total_amount: (Math.random() * 50 + 10).toFixed(2),
  status: i === 0 ? "pending" : "completed",
  prescription_number: null,
  prescribing_doctor: null,
  customer_id: "c1",
  user_id: "u1",
  created_at: new Date().toISOString()
}));

export const MOCK_USERS = [
  { id: "u1", username: "admin", email: "admin@meridian.local", first_name: "System", last_name: "Admin", role: "admin", is_active: true, last_login: new Date().toISOString() },
  { id: "u2", username: "cashier1", email: "cashier@meridian.local", first_name: "Sarah", last_name: "Lee", role: "cashier", is_active: true, last_login: new Date().toISOString() },
  { id: "u3", username: "pharmacist1", email: "pharm@meridian.local", first_name: "David", last_name: "Chen", role: "pharmacist", is_active: true, last_login: new Date().toISOString() }
];

export function getMockData<T>(path: string, method: string): T | undefined {
  if (method === "POST" || method === "PUT" || method === "PATCH") {
    return { success: true } as unknown as T;
  }
  if (path.includes("/products/low-stock")) {
    return MOCK_PRODUCTS.filter(p => p.quantity_in_stock <= p.reorder_level) as unknown as T;
  }
  if (path.includes("/products")) return MOCK_PRODUCTS as unknown as T;
  if (path.includes("/customers")) return MOCK_CUSTOMERS as unknown as T;
  if (path.includes("/sales")) return MOCK_SALES as unknown as T;
  if (path.includes("/users")) return MOCK_USERS as unknown as T;
  if (path.includes("/suppliers")) return [] as unknown as T;
  return undefined;
}
