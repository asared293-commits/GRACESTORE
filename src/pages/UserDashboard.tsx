/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useFirebase';
import { Order, Notification } from '../types';
import { formatPrice } from '../lib/utils';
import { where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Package, Clock, CheckCircle, Truck, MapPin, X, ShoppingBag, Bell, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function UserDashboard() {
  const { profile } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'notifications'>('orders');
  
  const { data: orders, loading: ordersLoading } = useCollection<Order>('orders', [
    where('userId', '==', profile?.uid || ''),
    orderBy('createdAt', 'desc')
  ]);

  const { data: notifications, loading: notifsLoading } = useCollection<Notification>('notifications', [
    where('userId', '==', profile?.uid || ''),
    orderBy('createdAt', 'desc')
  ]);

  const markAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="text-amber-500" size={20} />;
      case 'Confirmed': return <CheckCircle className="text-blue-500" size={20} />;
      case 'Out For Delivery': return <Truck className="text-indigo-500" size={20} />;
      case 'Delivered': return <CheckCircle className="text-emerald-500" size={20} />;
      default: return <Package className="text-neutral-500" size={20} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className="text-neutral-500">Track your orders and manage your profile.</p>
          </div>
          <div className="flex bg-neutral-100 p-1 rounded-2xl w-fit">
             <button 
               onClick={() => setActiveTab('orders')}
               className={cn(
                 "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                 activeTab === 'orders' ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
               )}
             >
               <Package size={18} /> Orders
             </button>
             <button 
               onClick={() => setActiveTab('notifications')}
               className={cn(
                 "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 relative",
                 activeTab === 'notifications' ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
               )}
             >
               <Bell size={18} /> Notifications
               {notifications?.some(n => !n.read) && (
                 <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-sm shadow-rose-200" />
               )}
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'orders' ? (
              <>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Package size={22} className="text-indigo-600" /> Recent Orders
                </h2>
                
                {ordersLoading ? (
                  <p className="text-neutral-400 animate-pulse">Loading orders...</p>
                ) : (orders?.length || 0) > 0 ? (
                  <div className="space-y-4">
                    {orders?.map((order) => (
                      <div key={order.id} className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                          <div>
                            <p className="text-sm font-bold">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-neutral-500">{format(new Date(order.createdAt), 'PPP')}</p>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 bg-neutral-50 rounded-full">
                            {getStatusIcon(order.status)}
                            <span className="text-xs font-bold uppercase">{order.status}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-end">
                           <div className="space-y-2">
                              <p className="text-sm text-neutral-600 flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] sm:max-w-md"><MapPin size={14} className="shrink-0" /> {order.deliveryType === 'delivery' ? order.deliveryAddress : 'Store Pickup'}</p>
                              <p className="font-bold text-lg">{formatPrice(order.totalAmount)}</p>
                           </div>
                           <button 
                             onClick={() => setSelectedOrder(order)}
                             className="text-sm font-bold text-indigo-600 hover:underline px-4 py-2 hover:bg-indigo-50 rounded-xl transition-colors"
                           >
                             View Details
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-neutral-200">
                    <Package className="mx-auto text-neutral-300 mb-4" size={48} />
                    <p className="text-neutral-500">No orders yet.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Bell size={22} className="text-indigo-600" /> Notifications
                </h2>
                
                {notifsLoading ? (
                  <p className="text-neutral-400 animate-pulse">Loading notifications...</p>
                ) : (notifications?.length || 0) > 0 ? (
                  <div className="space-y-3">
                    {notifications?.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={() => !notif.read && markAsRead(notif.id)}
                        className={cn(
                          "p-4 rounded-2xl border transition-all flex gap-4 cursor-pointer",
                          notif.read 
                            ? "bg-white border-neutral-100 opacity-70" 
                            : "bg-indigo-50/50 border-indigo-100 shadow-sm"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                          notif.type === 'chat' ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600"
                        )}>
                          {notif.type === 'chat' ? <MessageSquare size={18} /> : <Package size={18} />}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-sm truncate">{notif.title}</h4>
                            <span className="text-[10px] text-neutral-500 whitespace-nowrap ml-2">
                              {format(new Date(notif.createdAt), 'MMM d, HH:mm')}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">{notif.message}</p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-neutral-200">
                    <Bell className="mx-auto text-neutral-300 mb-4" size={48} />
                    <p className="text-neutral-500">All caught up! No notifications.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Profile Sidebar */}
          <aside className="space-y-8">
             <section className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-4 text-center">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                   {profile?.name?.[0].toUpperCase()}
                </div>
                <h3 className="text-xl font-bold">{profile?.name}</h3>
                <p className="text-sm text-neutral-500">{profile?.email}</p>
             </section>
             
             <section className="bg-indigo-600 p-8 rounded-3xl text-white space-y-4">
                <h3 className="font-bold">Need Help?</h3>
                <p className="text-sm opacity-90 leading-relaxed">If you have any questions about your order or our delivery policies, feel free to contact us.</p>
             </section>
          </aside>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                   <ShoppingBag size={20} />
                </div>
                <div>
                   <h2 className="font-bold">Order #{selectedOrder.id.slice(0, 8)}</h2>
                   <p className="text-xs text-neutral-500">{format(new Date(selectedOrder.createdAt), 'PPP p')}</p>
                </div>
              </div>
              <button 
                 onClick={() => setSelectedOrder(null)}
                 className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-8">
              {/* Order Status */}
              <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl">
                 {getStatusIcon(selectedOrder.status)}
                 <div>
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Status</p>
                    <p className="font-bold">{selectedOrder.status}</p>
                 </div>
              </div>

              {/* Delivery Info */}
              <div className="space-y-4">
                 <h3 className="font-bold text-sm text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                   <MapPin size={14} /> Delivery Information
                 </h3>
                 <div className="bg-white border border-neutral-100 p-4 rounded-2xl space-y-1">
                    <p className="text-xs font-bold text-neutral-500">Method</p>
                    <p className="font-medium text-sm capitalize">{selectedOrder.deliveryType}</p>
                    {selectedOrder.deliveryType === 'delivery' && (
                      <>
                        <p className="text-xs font-bold text-neutral-500 mt-3">Address</p>
                        <p className="font-medium text-sm">{selectedOrder.deliveryAddress}</p>
                        {selectedOrder.distanceFromStore && (
                           <p className="text-xs text-neutral-400 mt-1 italic">Distance from store: {selectedOrder.distanceFromStore.toFixed(2)} km</p>
                        )}
                      </>
                    )}
                 </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                 <h3 className="font-bold text-sm text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                   <ShoppingBag size={14} /> Items ordered
                 </h3>
                 <div className="space-y-3">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="flex gap-4 p-3 hover:bg-neutral-50 rounded-2xl transition-colors">
                        <img 
                          src={item.product?.images?.[0]} 
                          className="w-16 h-16 object-cover rounded-xl bg-neutral-100" 
                          referrerPolicy="no-referrer"
                          alt={item.product?.name}
                        />
                        <div className="flex-grow">
                          <p className="font-bold text-sm">{item.product?.name}</p>
                          <p className="text-xs text-neutral-500">{item.product?.weight || 'No weight info'}</p>
                          <div className="flex justify-between items-center mt-1">
                             <span className="text-xs font-medium text-neutral-600">Qty: {item.quantity}</span>
                             <span className="text-sm font-bold">{formatPrice(item.product?.price * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            {/* Summary Footer */}
            <div className="p-6 bg-neutral-50 border-t border-neutral-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-medium">{formatPrice(selectedOrder.totalAmount - (selectedOrder.deliveryFee || 0))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Delivery Fee</span>
                <span className="font-medium">{formatPrice(selectedOrder.deliveryFee || 0)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-neutral-200">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg text-indigo-600">{formatPrice(selectedOrder.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
