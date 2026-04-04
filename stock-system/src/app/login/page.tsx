'use client';
import { useState } from 'react';
import { useAuth, UserRole } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogIn, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

const DEMO_USERS = [
  { role: 'Administrator', email: 'admin@stocksms.com', pw: 'Stocks@123' },
  { role: 'Inventory Clerk', email: 'clerk@stocksms.com', pw: 'Stocks@123' },
  { role: 'Billing Clerk', email: 'billing@stocksms.com', pw: 'Stocks@123' },
  { role: 'Customer', email: 'customer@stocksms.com', pw: 'Stocks@123' },
  { role: 'Supplier', email: 'supplier@stocksms.com', pw: 'Stocks@123' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [showDemo, setShowDemo] = useState(true);
  const { login, isLoading, error: authError } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed');
    }
  };

  const fillDemo = (u: typeof DEMO_USERS[0]) => {
    setEmail(u.email);
    setPassword(u.pw);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-[1000px] w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center z-10">
        <div className="hidden lg:block space-y-8 pr-12">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldAlert className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">StockSMS</span>
          </div>
          
          <h1 className="text-6xl font-black text-white leading-[1.1]">
            Inventory <br />
            <span className="text-emerald-400">under control.</span>
          </h1>
          
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            Real-time stock tracking, automated purchase orders, invoice generation, and role-based access — all in one place.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-8">
            {[
              { label: 'Stock Accuracy', value: '99%' },
              { label: 'Page Response', value: '<2s' },
              { label: 'User Roles', value: '5' },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl">
                <div className="text-2xl font-bold text-emerald-400">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-8 lg:p-12 shadow-2xl shadow-black/50 relative">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Sign in to your account to continue</p>
          </div>

          {/* Demo Credentials Accordion */}
          <div className={`mb-8 border rounded-2xl transition-all duration-300 overflow-hidden ${showDemo ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-white'}`}>
            <button 
              onClick={() => setShowDemo(!showDemo)}
              className="w-full px-5 py-4 flex items-center justify-between text-sm font-semibold text-emerald-800"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🔑</span>
                Demo Credentials — click any to fill
              </div>
              {showDemo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showDemo && (
              <div className="px-5 pb-5 space-y-3">
                {DEMO_USERS.map((u) => (
                  <button 
                    key={u.role}
                    onClick={() => fillDemo(u)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-100/50 hover:border-emerald-300 hover:shadow-sm transition-all"
                  >
                    <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">{u.role}</span>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-600 font-medium">{u.email}</div>
                      <div className="text-[10px] text-slate-400">{u.pw}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider ml-1">Email Address</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider ml-1">Password</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password" 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900"
              />
            </div>

            {(localError || authError) && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <p>{localError || authError}</p>
              </div>
            )}

            <button 
              id="login-submit"
              type="submit" 
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-300 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                   <LogIn className="w-5 h-5" />
                   Sign in
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold">
                Stock Maintenance System · Demo Mode · No real data is stored
              </p>
            </div>
          </form>
        </div>
      </div>

      <div className="absolute bottom-6 left-12 text-slate-600 text-xs hidden lg:block">
        Stock Maintenance System · v1.0 · April 2026
      </div>
    </div>
  );
}
