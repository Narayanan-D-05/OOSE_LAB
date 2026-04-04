'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Search, Filter, MoreVertical, Edit2, Trash2, 
  AlertTriangle, Package, Loader2, ArrowRight
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  selling_price: number;
  current_stock: number;
  reorder_threshold: number;
  supplier_id: string | null;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    sku: '', name: '', category: 'Electronics', description: '',
    unit: 'pcs', selling_price: 0, reorder_threshold: 10
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin') return;

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{ ...formData, current_stock: 0 }]);
        if (error) throw error;
      }
      
      await fetchProducts();
      setIsModalOpen(false);
      setEditingProduct(null);
      resetForm();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product. Check console.');
    }
  };

  const handleDelete = async (id: string) => {
    if (user?.role !== 'admin' || !confirm('Are you sure?')) return;
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '', name: '', category: 'Electronics', description: '',
      unit: 'pcs', selling_price: 0, reorder_threshold: 10
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500">Manage your inventory catalogue and stock levels.</p>
        </div>
        
        {user?.role === 'admin' && (
          <button 
            onClick={() => { resetForm(); setEditingProduct(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-500 transition-all font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-bottom border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white">
            <Filter className="w-4 h-4" />
            All Categories
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-y border-slate-100">
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">SKU & Product</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Category</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Stock Level</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Price</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status</th>
                {user?.role === 'admin' && <th className="px-6 py-4 text-right"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No products found.</td>
                </tr>
              ) : filteredProducts.map((product) => {
                const isLowStock = product.current_stock <= product.reorder_threshold;
                return (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{product.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{product.sku}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isLowStock ? 'text-amber-500' : 'text-slate-700'}`}>
                          {product.current_stock}
                        </span>
                        <span className="text-xs text-slate-400">{product.unit}</span>
                        {isLowStock && (
                          <div className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black uppercase">Low</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">₹{product.selling_price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {isLowStock ? (
                        <div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Reorder
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Optimal
                        </div>
                      )}
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingProduct(product);
                              setFormData({
                                sku: product.sku,
                                name: product.name,
                                category: product.category,
                                description: product.description,
                                unit: product.unit,
                                selling_price: product.selling_price,
                                reorder_threshold: product.reorder_threshold
                              });
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Product Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animation-modal">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Product SKU</label>
                  <input 
                    required 
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="ELEC-USB-001"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option>Electronics</option>
                    <option>Stationery</option>
                    <option>Cleaning</option>
                    <option>Furniture</option>
                    <option>Networking</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Product Name</label>
                <input 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. Wireless Mouse"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unit Price (₹)</label>
                  <input 
                    type="number" required 
                    value={formData.selling_price}
                    onChange={(e) => setFormData({...formData, selling_price: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unit</label>
                  <input 
                    required 
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="pcs, ream, etc"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reorder Point</label>
                  <input 
                    type="number" required 
                    value={formData.reorder_threshold}
                    onChange={(e) => setFormData({...formData, reorder_threshold: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
