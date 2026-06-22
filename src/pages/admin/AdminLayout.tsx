/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Package, 
  ShoppingBag, 
  Settings, 
  MessageCircle, 
  Users, 
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCollection } from '../../hooks/useFirebase';
import { Order } from '../../types';

const navItems = [
  { icon: <BarChart3 size={20} />, label: 'Dashboard', path: '/admin' },
  { icon: <Package size={20} />, label: 'Products', path: '/admin/products' },
  { icon: <ShoppingBag size={20} />, label: 'Orders', path: '/admin/orders' },
  { icon: <Tag size={20} />, label: 'Promos', path: '/admin/promos' },
  { icon: <MessageCircle size={20} />, label: 'Chat', path: '/admin/chat' },
  { icon: <Settings size={20} />, label: 'Settings', path: '/admin/settings' },
];

export default function AdminLayout() {
  const location = useLocation();
  const { data: orders } = useCollection<Order>('orders');

  const newOrdersCount = orders.filter(order => {
    try {
      const createdDate = new Date(order.createdAt);
      const now = new Date();
      const diff = now.getTime() - createdDate.getTime();
      return diff <= 24 * 60 * 60 * 1000;
    } catch (e) {
      return false;
    }
  }).length;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-6 flex-grow overflow-y-auto">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6">Management</h2>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium",
                  location.pathname === item.path 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                    : "text-neutral-600 hover:bg-neutral-100"
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {location.pathname === item.path && <ChevronRight size={16} />}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-6 border-t border-neutral-100">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                    <TrendingUp size={40} />
                </div>
                <div className="flex items-center gap-2 text-indigo-600 mb-2 relative z-10">
                    <TrendingUp size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Live Stats</span>
                </div>
                <div className="relative z-10">
                  <p className="text-xl font-black text-indigo-950">{newOrdersCount}</p>
                  <p className="text-sm font-bold text-neutral-800">New Orders</p>
                  <p className="text-[10px] text-neutral-500">In the last 24 hours</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
