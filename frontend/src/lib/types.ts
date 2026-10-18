export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  price: string;
  cost: string;
  quantity_in_stock: number;
  reorder_level: number;
  expiry_date: string | null;
  category_id: string | null;
  supplier_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  medical_record_number: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  is_active: boolean;
  created_at: string;
};

export type Sale = {
  id: string;
  sale_number: string;
  sale_date: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  status: string;
  prescription_number: string | null;
  prescribing_doctor: string | null;
  customer_id: string | null;
  user_id: string;
  created_at: string;
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: string;
  unit_price: string;
  discount_amount: string;
  tax_amount: string;
  total_price: string;
};

export type Payment = {
  id: string;
  amount: string;
  payment_method: string;
  payment_status: string;
  sale_id: string;
  paid_at: string;
};

export type Receipt = {
  id: string;
  receipt_number: string;
  sale_id: string;
  receipt_type: string;
  issued_at: string;
};

export type Supplier = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
};

export type UserRow = {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
};
