'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { 
  Minus, Package, ArrowUpRight, ShoppingBag, 
  Hash, Loader2, CheckCircle2, AlertTriangle, ShieldAlert
} from 'lucide-react';

export default function StockOutPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 1,
    reference_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, current_stock, unit')
      .order('name');
    
    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  };

  const selectedProduct = products.find(p => p.id === formData.product_id);
  const hasInsufficientStock = selectedProduct ? selectedProduct.current_stock < formData.quantity : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin' && user?.role !== 'clerk') return;
    if (hasInsufficientStock) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Double check current stock in DB before transaction (primitive concurrency check)
      const { data: latestProduct, error: fetchError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', formData.product_id)
        .single();
      
      if (fetchError) throw fetchError;
      if (latestProduct.current_stock < formData.quantity) {
        throw new Error(`Insufficient stock. Current: ${latestProduct.current_stock}`);
      }

      // 2. Create the transaction record
      const { error: txError } = await supabase.from('stock_transactions').insert([{
        product_id: formData.product_id,
        type: 'STOCK_OUT',
        quantity: formData.quantity,
        reference_id: formData.reference_id || null,
        notes: formData.notes,
        performed_by: user.user_id
      }]);
      if (txError) throw txError;

      // 3. Update the product stock level
      const newStock = latestProduct.current_stock - formData.quantity;
      const { error: upError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', formData.product_id);
      
      if (upError) throw upError;

      setSuccess(true);
      setFormData({ product_id: '', quantity: 1, reference_id: '', notes: '' });
      await fetchProducts();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Stock Out failed:', err);
      setError(err.message || 'Failed to dispatch stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-4" />
      <p>Loading catalog data...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Stock Out (Dispatch)</h1>
        <p className="text-slate-500 font-medium">Record outgoing goods for sales orders or warehouse transfers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className={`bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm ${hasInsufficientStock ? 'ring-2 ring-red-500/20' : ''}`}>
            {success ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Stock Dispatched!</h3>
                <p className="text-slate-500">Inventory levels have been adjusted.</p>
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
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
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 transition-all ${hasInsufficientStock ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-100 focus:ring-red-500/10 focus:border-red-500'}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sales Order / Ref No.</label>
                    <input 
                      required 
                      value={formData.reference_id}
                      onChange={(e) => setFormData({...formData, reference_id: e.target.value})}
                      placeholder="SO-2024-004"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Notes</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Courier name, tracking ID, etc."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                    rows={3}
                  />
                </div>

                {hasInsufficientStock && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-bold">Insufficient Stock</p>
                      <p className="text-xs">You cannot dispatch more than the current available stock ({selectedProduct?.current_stock} units).</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting || !formData.product_id || hasInsufficientStock}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-neutral-800 shadow-xl shadow-red-600/20 transition-all flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Minus className="w-5 h-5" />}
                  Confirm Dispatch
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1e1e1e] rounded-[32px] p-6 text-white overflow-hidden relative border border-white/5 shadow-2xl">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-4">Stock Impact</h3>
              {formData.product_id ? (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Target Product</div>
                    <div className="font-bold">{selectedProduct?.name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Current</div>
                      <div className="text-xl font-bold">{selectedProduct?.current_stock}</div>
                    </div>
                    <div className={`p-4 border rounded-2xl text-center transition-all ${hasInsufficientStock ? 'bg-red-500/20 border-red-500/50' : 'bg-white/5 border-white/10'}`}>
                      <div className={`text-[10px] uppercase font-bold mb-1 ${hasInsufficientStock ? 'text-red-400' : 'text-slate-400'}`}>Remaining</div>
                      <div className={`text-xl font-bold ${hasInsufficientStock ? 'text-red-400' : 'text-blue-400'}`}>
                        {(selectedProduct?.current_stock || 0) - formData.quantity}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 italic text-sm">
                  Select a product to preview changes
                </div>
              )}
            </div>
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-red-500/10 rounded-full blur-2xl" />
          </div>

          <div className="p-6 border border-slate-200 rounded-[32px] bg-slate-50 space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <h4 className="font-bold text-sm">Strict Validation</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              System blocks any dispatch higher than current stock to prevent negative inventory balances. Over-allocation is disabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
