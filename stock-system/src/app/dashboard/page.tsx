'use client';
import { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { 
  Package, TrendingUp, ShoppingCart, Users, 
  ArrowUpRight, ArrowDownLeft, AlertCircle, Clock, CheckCircle2,
  ChevronRight, ArrowRight, Loader2, RefreshCcw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import Link from 'next/link';

export default function Dashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    products: 0,
    totalStock: 0,
    revenue: 0,
    salesCount: 0,
    customers: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, salesRes, custRes, txRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('sales_orders').select('*, customer:customers(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('customers').select('id', { count: 'exact' }),
        supabase.from('stock_transactions').select('*, product:products(name)').order('created_at', { ascending: false }).limit(5)
      ]);

      const products = prodRes.data || [];
      const sales = salesRes.data || [];
      const txs = txRes.data || [];

      setStats({
        products: products.length,
        totalStock: products.reduce((sum, p) => sum + p.current_stock, 0),
        revenue: (salesRes.data || []).reduce((sum, s) => sum + (s.total || 0), 0),
        salesCount: (salesRes.data || []).length,
        customers: custRes.count || 0
      });

      setLowStockProducts(products.filter(p => p.current_stock <= p.reorder_threshold).slice(0, 3));
      setRecentSales(sales);
      setRecentTransactions(txs);

    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
      <p>Building your dashboard...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Good morning, {user?.full_name.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your inventory today.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-100 uppercase tracking-widest">
           {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-[28px] p-2 flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 px-4 py-2">
            <AlertCircle className="text-amber-500 w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-bold text-amber-900">
              {lowStockProducts.length} products below reorder threshold:
            </span>
            <span className="text-sm text-amber-700 hidden lg:inline">
              {lowStockProducts.map(p => p.name).join(', ')}
            </span>
          </div>
          <Link 
            href="/purchase-orders" 
            className="ml-auto flex items-center gap-2 bg-amber-500 text-white px-6 py-2 rounded-2xl hover:bg-amber-600 transition-all font-bold text-sm"
          >
            Create PO <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 border border-slate-100 rounded-[32px] shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Total Products</div>
          <div className="text-3xl font-black text-slate-900 leading-none">{stats.products}</div>
          <div className="text-xs text-slate-500 mt-2 font-medium">{stats.totalStock} units in stock</div>
        </div>

        <div className="bg-white p-6 border border-slate-100 rounded-[32px] shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-emerald-500 text-sm font-black">
              <ArrowUpRight className="w-4 h-4" /> +14%
            </div>
          </div>
          <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Revenue (YTD)</div>
          <div className="text-3xl font-black text-slate-900 leading-none">₹{stats.revenue.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-2 font-medium">↑ +₹12,421 vs last month</div>
        </div>

        <div className="bg-white p-6 border border-slate-100 rounded-[32px] shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-purple-600 group-hover:text-white">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
          <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Sales Orders</div>
          <div className="text-3xl font-black text-slate-900 leading-none">{stats.salesCount}</div>
          <div className="text-xs text-slate-500 mt-2 font-medium">2 paid · {stats.salesCount - 2} pending</div>
        </div>

        <div className="bg-white p-6 border border-slate-100 rounded-[32px] shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-amber-600 group-hover:text-white">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Customers</div>
          <div className="text-3xl font-black text-slate-900 leading-none">{stats.customers}</div>
          <div className="text-xs text-slate-500 mt-2 font-medium">Active accounts</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenue Overview</h3>
              <p className="text-sm text-slate-400">Last 6 months performance</p>
            </div>
            <select className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 focus:outline-none">
              <option>Last 6 months</option>
              <option>Year 2026</option>
            </select>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Oct', rev: 24000 }, { name: 'Nov', rev: 35000 }, { name: 'Dec', rev: 48000 },
                { name: 'Jan', rev: 38000 }, { name: 'Feb', rev: 45000 }, { name: 'Mar', rev: 42000 }
              ]}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="rev" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm flex flex-col">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900">Stock by Category</h3>
            <p className="text-sm text-slate-400">Units distribution</p>
          </div>
          <div className="flex-1 min-h-[220px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Electronics', value: 400 }, { name: 'Cleaning', value: 300 },
                    { name: 'Office', value: 300 }, { name: 'Networking', value: 200 }
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  <Cell fill="#10b981" /> <Cell fill="#f59e0b" />
                  <Cell fill="#3b82f6" /> <Cell fill="#8b5cf6" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <div className="text-2xl font-black text-slate-900">1.2k</div>
               <div className="text-[10px] uppercase font-bold text-slate-400">Total Units</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {['Electronics', 'Stationery', 'Cleaning', 'Furniture'].map((cat, i) => (
              <div key={cat} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500'][i]}`} />
                <span className="text-xs font-semibold text-slate-600">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Recent Stock Movements</h3>
            <Link href="/stock/in" className="text-xs font-bold text-emerald-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-1">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-all rounded-2x border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${tx.type === 'STOCK_IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {tx.type === 'STOCK_IN' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{tx.product?.name}</div>
                    <div className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">
                       Ref: {tx.reference_id || 'N/A'} · {new Date(tx.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black ${tx.type === 'STOCK_IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.type === 'STOCK_IN' ? '+' : '-'}{tx.quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Recent Sales Orders</h3>
            <Link href="/sales" className="text-xs font-bold text-indigo-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-indigo-200 group-hover:bg-indigo-500 transition-all" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">{sale.order_number}</div>
                    <div className="text-[10px] text-slate-400">{sale.customer?.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">₹{(sale.total || 0).toLocaleString()}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${sale.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {sale.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
