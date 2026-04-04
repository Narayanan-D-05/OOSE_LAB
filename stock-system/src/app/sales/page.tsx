'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Search, ShoppingCart, Eye, 
  CreditCard, CheckCircle2, Clock, XCircle, Loader2,
  Calendar, User, Trash2
} from 'lucide-react';

interface SalesItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED';
  total: number;
  payment_status: 'UNPAID' | 'PAID' | 'REFUNDED';
  created_at: string;
  customer?: { name: string; email: string; billing_address: string };
  sales_order_items?: SalesItem[];
}

export default function SalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<SalesOrder | null>(null);

  // New Sale Form State
  const [formData, setFormData] = useState({
    customer_id: '',
    items: [{ product_id: '', quantity: 1, unit_price: 0 }] as SalesItem[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [salesRes, productsRes, customersRes] = await Promise.all([
      supabase.from('sales_orders').select('*, customer:customers(*)').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, selling_price, current_stock'),
      supabase.from('customers').select('id, name')
    ]);
    
    setSales(salesRes.data || []);
    setProducts(productsRes.data || []);
    setCustomers(customersRes.data || []);
    setIsLoading(false);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 1, unit_price: 0 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: keyof SalesItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'product_id') {
      const prod = products.find(p => p.id === value);
      if (prod) newItems[index].unit_price = prod.selling_price;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = (items: SalesItem[]) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin' && user?.role !== 'billing') return;

    setIsSubmitting(true);
    try {
      const totalAmount = calculateTotal(formData.items);
      const order_number = `SO-${Date.now().toString().slice(-6)}`;

      // 1. Create the Sale Order
      const { data: order, error: orderError } = await supabase
        .from('sales_orders')
        .insert([{
          order_number,
          customer_id: formData.customer_id,
          subtotal: totalAmount,
          total: totalAmount,
          status: 'PENDING',
          created_by: user.user_id
        }])
        .select()
        .single();
      
      if (orderError) throw orderError;

      // 2. Create the items
      const itemsToInsert = formData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('so_line_items')
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;

      // 3. Update stock levels (In a real app, this should be in the same transaction)
      for (const item of formData.items) {
        const prod = products.find(p => p.id === item.product_id);
        if (prod) {
          await supabase
            .from('products')
            .update({ current_stock: prod.current_stock - item.quantity })
            .eq('id', item.product_id);
        }
      }

      await fetchData();
      setIsModalOpen(false);
      setFormData({ customer_id: '', items: [{ product_id: '', quantity: 1, unit_price: 0 }] });
    } catch (err: any) {
      console.error('Sale creation failed:', err.message || JSON.stringify(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePaymentStatus = async (id: string, status: 'PAID') => {
    try {
      await supabase.from('sales_orders').update({ status: 'PAID' }).eq('id', id);
      await fetchData();
    } catch (err) {
      console.error('Payment update failed:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-600';
      case 'PAID': return 'bg-emerald-100 text-emerald-600';
      case 'SHIPPED': return 'bg-blue-100 text-blue-600';
      case 'CANCELLED': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales & Invoices</h1>
          <p className="text-slate-500">Record sales transactions and manage customer billing.</p>
        </div>
        
        {(user?.role === 'admin' || user?.role === 'billing') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-500 transition-all font-semibold shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-5 h-5" />
            New Sale Order
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading sales records...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">No sales orders found.</td>
                </tr>
              ) : sales.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-900">{order.order_number}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{order.customer?.name}</td>
                  <td className="px-6 py-4 font-black text-slate-900">₹{order.total.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {order.status === 'PAID' ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5" /> PAID
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-500 text-xs font-bold uppercase">
                        <Clock className="w-3.5 h-3.5" /> UNPAID
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {order.status !== 'PAID' && (user?.role === 'admin' || user?.role === 'billing') && (
                        <button 
                          onClick={() => updatePaymentStatus(order.id, 'PAID')}
                          className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold hover:bg-emerald-100"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button 
                        onClick={() => setViewingInvoice(order)}
                        className="p-2 text-slate-300 hover:text-slate-900"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden animation-modal max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">New Sales Order</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-light">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Customer</label>
                <select 
                  required 
                  value={formData.customer_id}
                  onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Search customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Cart Items</h3>
                  <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>

                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="col-span-12 md:col-span-6 space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Product</label>
                      <select 
                        required 
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="">Select product...</option>
                        {products.map(p => <option key={p.id} value={p.id} disabled={p.current_stock < 1}>{p.name} ({p.current_stock} avail)</option>)}
                      </select>
                    </div>
                    <div className="col-span-12 md:col-span-2 space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Qty</label>
                      <input 
                        type="number" min="1" required 
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <div className="text-[9px] uppercase font-bold text-slate-400 mb-1">Subtotal</div>
                      <div className="text-sm font-bold text-slate-900">₹{(item.quantity * item.unit_price).toLocaleString()}</div>
                    </div>
                    <div className="col-span-12 md:col-span-1 text-right">
                      {formData.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(index)} className="p-2 text-slate-300 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Total Bill Amount</div>
                  <div className="text-3xl font-black text-indigo-600">
                    ₹{calculateTotal(formData.items).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !formData.customer_id || formData.items.some(i => !i.product_id)}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                    Place Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-3xl shadow-2xl overflow-hidden animation-modal h-[90vh] flex flex-col">
            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">INVOICE</h2>
                  <p className="text-slate-500">#{viewingInvoice.order_number}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">StockSMS Ltd.</div>
                  <div className="text-sm text-slate-500">123 Tech Park, Bangalore</div>
                  <div className="text-sm text-slate-500">GSTIN: 29AAAAA0000A1Z5</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Billed To:</div>
                  <div className="font-bold text-slate-900">{viewingInvoice.customer?.name}</div>
                  <div className="text-sm text-slate-500 leading-relaxed">{viewingInvoice.customer?.billing_address}</div>
                  <div className="text-sm text-slate-500">{viewingInvoice.customer?.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Order Details:</div>
                  <div className="text-sm text-slate-600 mb-1">Date: <span className="font-bold text-slate-900">{new Date(viewingInvoice.created_at).toLocaleDateString()}</span></div>
                  <div className="text-sm text-slate-600 mb-1">Status: <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${getStatusColor(viewingInvoice.status)}`}>{viewingInvoice.status}</span></div>
                </div>
              </div>

              <table className="w-full text-left border-collapse mb-12">
                <thead>
                  <tr className="border-b-2 border-slate-900">
                    <th className="py-4 text-[11px] font-black uppercase text-slate-900">Item Description</th>
                    <th className="py-4 text-[11px] font-black uppercase text-slate-900 text-right">Qty</th>
                    <th className="py-4 text-[11px] font-black uppercase text-slate-900 text-right">Price</th>
                    <th className="py-4 text-[11px] font-black uppercase text-slate-900 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Real implementation should fetch order items, but for now we'll show the summary */}
                  <tr>
                    <td className="py-4">
                      <div className="font-bold text-slate-900">Software Integration Services</div>
                      <div className="text-xs text-slate-500">General service charge for invoice generation</div>
                    </td>
                    <td className="py-4 text-right text-slate-600">1</td>
                    <td className="py-4 text-right text-slate-600">₹{viewingInvoice.total.toLocaleString()}</td>
                    <td className="py-4 text-right font-bold text-slate-900">₹{viewingInvoice.total.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">₹{viewingInvoice.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>GST (18%)</span>
                    <span className="font-bold text-slate-900">₹0.00</span>
                  </div>
                  <div className="pt-3 border-t-2 border-slate-900 flex justify-between">
                    <span className="font-black uppercase text-slate-900">Grand Total</span>
                    <span className="font-black text-indigo-600 text-xl">₹{viewingInvoice.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setViewingInvoice(null)}
                className="flex-1 px-6 py-3 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-white"
              >
                Close Preview
              </button>
              <button className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
