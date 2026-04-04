'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth, ROLE_LABELS, ROLE_COLORS } from '@/lib/auth-context';
import {
  LayoutDashboard, Package, Truck, ArrowDownCircle, ArrowUpCircle,
  ShoppingCart, Users, Receipt, FileText, BarChart2,
  LogOut, Bell, ChevronRight, Package2
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
}

const NAV: NavItem[] = [
  { href: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/products',         icon: Package,         label: 'Products' },
  { href: '/suppliers',        icon: Truck,           label: 'Suppliers',        roles: ['admin','clerk'] },
  { href: '/stock/in',         icon: ArrowDownCircle, label: 'Stock In',        roles: ['admin','clerk'] },
  { href: '/stock/out',        icon: ArrowUpCircle,   label: 'Stock Out',       roles: ['admin','clerk'] },
  { href: '/purchase-orders',  icon: ShoppingCart,    label: 'Purchase Orders', roles: ['admin','clerk'] },
  { href: '/customers',        icon: Users,           label: 'Customers',       roles: ['admin','billing'] },
  { href: '/sales',            icon: Receipt,         label: 'Sales & Invoices',roles: ['admin','billing','customer'] },
  { href: '/reports',          icon: BarChart2,       label: 'Reports',         roles: ['admin'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  if (isLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const visibleNav = NAV.filter(n => !n.roles || n.roles.includes(user.role));
  const initials = user.full_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
              <Package2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight">StockSMS</div>
              <div className="text-[10px] text-slate-400 leading-tight">Inventory System</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`sidebar-link ${active ? 'active' : ''}`}>
                <item.icon className="icon" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">{user.full_name}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ROLE_COLORS[user.role]}`}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>
          <button
            id="logout-btn"
            onClick={() => { logout(); router.push('/login'); }}
            className="btn-ghost w-full justify-center text-xs text-slate-500"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-8 h-14 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-slate-500 breadcrumb">
            {visibleNav.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.label ?? 'Dashboard'}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer">
              <Bell className="w-4 h-4" />
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
