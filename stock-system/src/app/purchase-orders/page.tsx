'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Search, Filter, FileText, ChevronRight, 
  Calendar, Truck, CheckCircle2, Clock, XCircle, Loader2,
  Trash2, PlusCircle
} from 'lucide-react';

interface POItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  total_amount: number;
  expected_date: string;
  created_at: string;
  supplier?: { name: string };
  purchase_order_items?: POItem[];
}

export default function PurchaseOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Order Form State
  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_date: '',
    items: [{ product_id: '', quantity: 1, unit_cost: 0 }] as any[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [ordersRes, productsRes, suppliersRes] = await Promise.all([
      supabase.from('purchase_orders').select('*, supplier:suppliers(name)').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, selling_price'),
      supabase.from('suppliers').select('id, name')
    ]);
    
    setOrders(ordersRes.data || []);
    setProducts(productsRes.data || []);
    setSuppliers(suppliersRes.data || []);
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

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill price if product changes
    if (field === 'product_id') {
      const prod = products.find(p => p.id === value);
      if (prod) newItems[index].unit_cost = prod.selling_price;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin' && user?.role !== 'clerk') return;
    
    setIsSubmitting(true);
    try {
      const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
      const po_number = `PO-${Date.now().toString().slice(-6)}`;

      // 1. Create the PO
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert([{
          po_number,
          supplier_id: formData.supplier_id,
          expected_date: formData.expected_date || null,
          total_amount: totalAmount,
          status: 'DRAFT',
          created_by: user.user_id
        }])
        .select()
        .single();
      
      if (poError) throw poError;

      // 2. Create the items
      const itemsToInsert = formData.items.map(item => ({
        po_id: po.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost
      }));

      const { error: itemsError } = await supabase
        .from('po_line_items')
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;

      await fetchData();
      setIsModalOpen(false);
      setFormData({ supplier_id: '', expected_date: '', items: [{ product_id: '', quantity: 1, unit_cost: 0 }] });
    } catch (err) {
      console.error('PO Creation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (id: string, newStatus: PurchaseOrder['status']) => {
    if (user?.role !== 'admin' && user?.role !== 'clerk') return;
    try {
      await supabase.from('purchase_orders').update({ status: newStatus }).eq('id', id);
      await fetchData();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-600';
      case 'SENT': return 'bg-blue-100 text-blue-600';
      case 'PARTIALLY_RECEIVED': return 'bg-amber-100 text-amber-600';
      case 'RECEIVED': return 'bg-emerald-100 text-emerald-600';
      case 'CANCELLED': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-slate-500">Track and manage inventory procurement.</p>
        </div>
        
        {(user?.role === 'admin' || user?.role === 'clerk') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-all font-semibold"
          >
            <Plus className="w-5 h-5" />
            New Purchase Order
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by PO number or supplier..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white">
              <Filter className="w-4 h-4" />
              Status: All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Expected Date</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-900" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No purchase orders found.</td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{order.po_number}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{new Date(order.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{order.supplier?.name}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">₹{order.total_amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {order.expected_date ? new Date(order.expected_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {order.status === 'DRAFT' && (
                        <button 
                          onClick={() => updateStatus(order.id, 'SENT')}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-all"
                        >
                          Send PO
                        </button>
                      )}
                      {order.status === 'SENT' && (
                        <button 
                          onClick={() => updateStatus(order.id, 'RECEIVED')}
                          className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-all"
                        >
                          Mark Received
                        </button>
                      )}
                      <button className="p-2 text-slate-300 hover:text-slate-900">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-[40px] w-full max-w-3xl shadow-2xl overflow-hidden animation-modal max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-slate-400" />
                New Purchase Order
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-light">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Supplier</label>
                  <select 
                    required 
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                  >
                    <option value="">Choose a supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Expected Delivery</label>
                  <input 
                    type="date"
                    value={formData.expected_date}
                    onChange={(e) => setFormData({...formData, expected_date: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-900">Line Items</h3>
                  <button 
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-500"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Product
                  </button>
                </div>

                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-12 md:col-span-5 space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Product</label>
                      <select 
                        required 
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                      >
                        <option value="">Select...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-4 md:col-span-2 space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Qty</label>
                      <input 
                        type="number" min="1" required 
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-3 space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Price (₹)</label>
                      <input 
                        type="number" required 
                        value={item.unit_cost}
                        onChange={(e) => updateItem(index, 'unit_cost', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-2 pb-1.5 text-right">
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
                  <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Total Amount</div>
                  <div className="text-3xl font-black text-slate-900">
                    ₹{formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !formData.supplier_id || formData.items.some(i => !i.product_id)}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-900/20 flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Create Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
