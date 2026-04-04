'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Package, ArrowDownLeft, Building2, 
  Calendar, Hash, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function StockInPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    product_id: '',
    supplier_id: '',
    quantity: 1,
    batch_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [prodRes, suppRes] = await Promise.all([
      supabase.from('products').select('id, name, sku, current_stock, unit'),
      supabase.from('suppliers').select('id, name, contact_person')
    ]);
    
    setProducts(prodRes.data || []);
    setSuppliers(suppRes.data || []);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin' && user?.role !== 'clerk') return;
    
    setIsSubmitting(true);
    try {
      // 1. Create the transaction record
      const { error: txError } = await supabase.from('stock_transactions').insert([{
        product_id: formData.product_id,
        type: 'STOCK_IN',
        quantity: formData.quantity,
        reference_id: formData.batch_number || null,
        notes: formData.notes,
        performed_by: user.user_id
      }]);
      if (txError) throw txError;

      // 2. Update the product stock level
      // In a real app, this should be a DB function/trigger to prevent race conditions
      const product = products.find(p => p.id === formData.product_id);
      const newStock = (product?.current_stock || 0) + formData.quantity;
      
      const { error: upError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', formData.product_id);
      
      if (upError) throw upError;

      setSuccess(true);
      setFormData({ product_id: '', supplier_id: '', quantity: 1, batch_number: '', notes: '' });
      await fetchData();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Stock In failed:', err);
      alert('Failed to record stock. Check console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
      <p>Loading catalog data...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Stock In (Procurement)</h1>
        <p className="text-slate-500 font-medium">Record incoming goods from suppliers into the warehouse.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
            {success ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Stock Recorded Successfully!</h3>
                <p className="text-slate-500">Inventory levels have been updated in real-time.</p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                  New Transaction
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Product</label>
                  <select 
                    required 
                    value={formData.product_id}
                    onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                  >
                    <option value="">Choose a product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quantity</label>
                    <input 
                      type="number" min="1" required 
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Batch / Ref No.</label>
                    <input 
                      required 
                      value={formData.batch_number}
                      onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                      placeholder="PO-2024-001"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Supplier (Optional)</label>
                  <select 
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                  >
                    <option value="">Choose a supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Notes</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Condition of goods, location, etc."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                    rows={3}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || !formData.product_id}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:bg-emerald-300"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Register Stock In
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-4">Stock Preview</h3>
              {formData.product_id ? (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Target Product</div>
                    <div className="font-bold">{products.find(p => p.id === formData.product_id)?.name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Current</div>
                      <div className="text-xl font-bold">{products.find(p => p.id === formData.product_id)?.current_stock}</div>
                    </div>
                    <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-center">
                      <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">New Total</div>
                      <div className="text-xl font-bold text-emerald-400">
                        {(products.find(p => p.id === formData.product_id)?.current_stock || 0) + formData.quantity}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 italic text-sm">
                  Select a product to see stock impact
                </div>
              )}
            </div>
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
          </div>

          <div className="p-6 border border-slate-200 rounded-[32px] bg-slate-50 space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h4 className="font-bold text-sm">Logging Policy</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every stock insertion is logged with your User ID and a timestamp. 
              Manual stock overrides are only permitted for Administrators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
