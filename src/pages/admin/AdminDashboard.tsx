/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Users, ShoppingBag, DollarSign, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { useCollection } from '../../hooks/useFirebase';
import { Order, Product, UserProfile } from '../../types';
import { formatPrice } from '../../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

const dummyData = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 5000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

export default function AdminDashboard() {
  const { data: orders = [] } = useCollection<Order>('orders');
  const { data: products = [] } = useCollection<Product>('products');
  const { data: users = [] } = useCollection<UserProfile>('users');

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const completedOrders = orders.filter(o => o.status === 'Completed').length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;

  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayDateStr = d.toISOString().split('T')[0];
    
    const daySales = orders
      .filter(o => o.createdAt.startsWith(dayDateStr))
      .reduce((sum, o) => sum + o.totalAmount, 0);
      
    return { name: dayName, sales: daySales };
  });

  const inStockProducts = products.filter(p => p.stock > 0).length;
  const stockPercentage = Math.round((inStockProducts / (products.length || 1)) * 100);

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Store Overview</h1>
          <p className="text-neutral-500">Welcome back, admin. Here is what's happening today.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={async () => {
              if (confirm('Seed the database with sample products and categories?')) {
                try {
                  const cats = ['Fashion', 'Electronics', 'Home Decor', 'Accessories'];
                  for (const c of cats) {
                    await addDoc(collection(db, 'categories'), { name: c, createdAt: new Date().toISOString() });
                  }
                  toast.success('Seeded categories!');
                } catch (e) { toast.error('Seeding failed'); }
              }
            }}
            className="px-4 py-2 bg-neutral-100 rounded-lg text-sm font-medium hover:bg-neutral-200"
          >
            Seed Categories
          </button>
          <div className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium">
            Last 7 Days
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: <DollarSign />, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Total Orders', value: orders.length, icon: <ShoppingBag />, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Products', value: products.length, icon: <Package />, color: 'bg-amber-50 text-amber-600' },
          { label: 'Customers', value: users.length, icon: <Users />, color: 'bg-rose-50 text-rose-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-2xl ${stat.color}`}>{stat.icon}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
              <h4 className="text-2xl font-bold">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Revenue Analytics</h3>
            <span className="text-xs text-neutral-400 font-medium">GHS - Last 7 Days</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7DaysData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  formatter={(value) => [`GHS ${value}`, 'Sales']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-8">
          <h3 className="text-lg font-bold">Order Breakdown</h3>
          <div className="space-y-6">
            {[
              { label: 'Pending Orders', value: pendingOrders, total: orders.length, color: 'bg-amber-500' },
              { label: 'Completed', value: completedOrders, total: orders.length, color: 'bg-emerald-500' },
              { label: 'In Progress', value: orders.filter(o => ['Processing', 'Out For Delivery'].includes(o.status)).length, total: orders.length, color: 'bg-indigo-500' },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-neutral-600">{item.label}</span>
                  <span className="font-bold">{item.value} / {item.total}</span>
                </div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                   <div 
                     className={`h-full ${item.color} rounded-full transition-all duration-500`} 
                     style={{ width: `${(item.value / (item.total || 1)) * 100}%` }}
                   />
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-6 border-t border-neutral-100">
             <div className="p-4 bg-indigo-600 rounded-2xl text-white text-center shadow-lg shadow-indigo-100">
                 <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Stock Availability</p>
                 <p className="text-xl font-bold">{stockPercentage}% In Stock</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
