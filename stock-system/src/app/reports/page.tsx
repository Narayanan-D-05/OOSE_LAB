'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, TrendingUp, AlertTriangle, ArrowDown, 
  ArrowUp, FileSpreadsheet, Calendar, RefreshCcw, Loader2,
  Package, ShoppingCart, Truck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell 
} from 'recharts';

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'inventory' | 'transactions' | 'sales'>('inventory');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    totalRevenue: 0,
    totalSales: 0,
    inventoryValue: 0
  });

  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [transactionData, setTransactionData] = useState<any[]>([]);

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Basic Stats
      const [prodRes, salesRes, txRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('sales_orders').select('*'),
        supabase.from('stock_transactions').select('*').limit(100).order('created_at', { ascending: false })
      ]);

      const products = prodRes.data || [];
      const sales = salesRes.data || [];
      const txs = txRes.data || [];

      setStats({
        totalProducts: products.length,
        lowStockItems: products.filter(p => p.current_stock <= p.reorder_threshold).length,
        totalRevenue: sales.reduce((sum, s) => sum + (s.total || 0), 0),
        totalSales: sales.length,
        inventoryValue: products.reduce((sum, p) => sum + (p.current_stock * p.selling_price), 0)
      });

      setInventoryData(products);
      setSalesData(sales);
      setTransactionData(txs);

    } catch (err) {
      console.error('Report fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = (data: any[], filename: string) => {
    const header = Object.keys(data[0] || {}).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + header + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p>Reports are only available for Administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500">Business performance metrics and real-time stock insights.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchReportData()}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
          >
            <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => exportCSV(activeTab === 'inventory' ? inventoryData : activeTab === 'sales' ? salesData : transactionData, `report_${activeTab}`)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-500 transition-all font-semibold"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 border border-slate-200 rounded-[32px] shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none">Total Products</div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.totalProducts}</div>
          <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-tighter">Catalogue size</div>
        </div>

        <div className="bg-white p-6 border border-slate-200 rounded-[32px] shadow-sm ring-2 ring-amber-500/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-[10px] uppercase font-black text-amber-600/60 tracking-widest leading-none">Low Stock</div>
          </div>
          <div className="text-3xl font-black text-amber-600">{stats.lowStockItems}</div>
          <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-tighter">Needs Attention</div>
        </div>

        <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-xl shadow-slate-900/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-white/10 text-white rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none">Total Revenue</div>
          </div>
          <div className="text-3xl font-black">₹{stats.totalRevenue.toLocaleString()}</div>
          <div className={`text-xs mt-1 flex items-center gap-1 font-bold ${stats.totalRevenue > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
            <ArrowUp className="w-3 h-3" /> All time
          </div>
        </div>

        <div className="bg-emerald-600 p-6 rounded-[32px] text-white shadow-xl shadow-emerald-600/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-white/10 text-white rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div className="text-[10px] uppercase font-black text-emerald-100/60 tracking-widest leading-none">Sales Orders</div>
          </div>
          <div className="text-3xl font-black">{stats.totalSales}</div>
          <div className="text-xs text-emerald-100/80 mt-1 uppercase font-bold tracking-tighter">Completed orders</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-100">
          {(['inventory', 'transactions', 'sales'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-5 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === tab ? 'border-emerald-600 text-emerald-600 bg-emerald-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-500" />
              Generating report...
            </div>
          ) : activeTab === 'inventory' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Category Distribution</h3>
                <p className="text-sm text-slate-500 mb-8">Stock units distributed across all active categories.</p>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryData.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" hide />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="current_stock" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-50 rounded-[32px] p-8 space-y-6">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Stock Highlights</h4>
                <div className="space-y-4">
                   <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                     <span className="text-sm text-slate-600">Inventory Value</span>
                     <span className="text-lg font-black text-slate-900">₹{stats.inventoryValue.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                     <span className="text-sm text-slate-600">Stock Turnover</span>
                     <span className="text-lg font-black text-blue-600">12.4x</span>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="px-6 py-4">ID/Ref</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeTab === 'transactions' ? transactionData : salesData).slice(0, 10).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{row.reference_id || row.order_number}</td>
                      <td className="px-6 py-4 text-xs">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold">
                        {activeTab === 'transactions' ? (
                          <span className={row.type === 'STOCK_IN' ? 'text-emerald-600' : 'text-red-600'}>
                            {row.type === 'STOCK_IN' ? '+' : '-'}{row.quantity}
                          </span>
                        ) : (
                          `₹${(row.total || 0).toLocaleString()}`
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${activeTab === 'transactions' ? (row.type === 'STOCK_IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700') : 'bg-indigo-100 text-indigo-700'}`}>
                          {row.type || 'SALE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
