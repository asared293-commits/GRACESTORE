/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useCollection } from '../../hooks/useFirebase';
import { Order, OrderItem } from '../../types';
import { formatPrice, cn } from '../../lib/utils';
import { updateDoc, doc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import { Eye, Filter, CheckCircle2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const { data: orders } = useCollection<Order>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    const snap = await getDocs(collection(db, 'orders', order.id, 'items'));
    setOrderItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as OrderItem)));
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      toast.success('Order status updated');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: status as any });
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Confirmed': return 'bg-blue-100 text-blue-700';
      case 'Processing': return 'bg-indigo-100 text-indigo-700';
      case 'Delivered': return 'bg-emerald-100 text-emerald-700';
      case 'Cancelled': return 'bg-rose-100 text-rose-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center text-indigo-950 font-bold">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-neutral-500 font-normal">Review and fulfill your customer orders.</p>
        </div>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-neutral-50"><Filter size={16} /> Filters</button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm">
              <p className="text-xs text-neutral-500 font-bold uppercase mb-1">New Orders</p>
              <h4 className="text-2xl font-bold">{orders.filter(o => o.status === 'Pending').length}</h4>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm text-indigo-950 font-bold">
              <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Today's Revenue</p>
              <h4 className="text-2xl font-bold">{formatPrice(orders.reduce((s,o) => s + o.totalAmount, 0))}</h4>
          </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase">Order</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase">Customer</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase">Total</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-indigo-950 font-bold">
            {orders?.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map((order) => (
              <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {order.previewImage ? (
                        <img src={order.previewImage} className="w-12 h-12 rounded-xl object-cover bg-neutral-100 shadow-sm border border-neutral-100" alt="" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400 border border-neutral-100">
                          <ShoppingBag size={20} />
                        </div>
                      )}
                      {order.itemCount && order.itemCount > 1 && (
                        <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          +{order.itemCount - 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-mono leading-none font-black text-indigo-950">#{order.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-neutral-400 font-normal mt-1 italic group-hover:text-neutral-500">{format(new Date(order.createdAt), 'MMM d, p')}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-0.5">
                    <p className="font-bold">{order.customerName}</p>
                    <p className="text-xs text-neutral-500 font-normal">{order.customerContact}</p>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold">
                  <span className="capitalize">{order.deliveryType}</span>
                </td>
                <td className="px-6 py-4">{formatPrice(order.totalAmount)}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleViewOrder(order)}
                    className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh]">
            <header className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <div>
                <h2 className="text-xl font-bold">Order Details</h2>
                <p className="text-sm text-neutral-500">#{selectedOrder.id} • {format(new Date(selectedOrder.createdAt), 'PPpp')}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-neutral-200 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="flex-grow overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Order Info */}
                <div className="md:col-span-2 space-y-8">
                  <section className="space-y-4">
                    <h3 className="font-bold text-lg border-b border-neutral-100 pb-2">Purchased Items</h3>
                    <div className="space-y-4">
                      {orderItems?.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 border border-neutral-100 rounded-2xl items-center text-indigo-950 font-bold">
                          <img src={item.image} className="w-16 h-16 rounded-xl object-cover shrink-0" alt="" />
                          <div className="flex-grow">
                            <p className="font-bold">{item.name}</p>
                            <p className="text-xs text-neutral-500 font-normal">Qty: {item.quantity} • {formatPrice(item.price)} each</p>
                          </div>
                          <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-50 rounded-2xl space-y-2">
                        <p className="text-xs font-bold text-neutral-400 uppercase">Delivery Details</p>
                        <p className="text-sm font-bold uppercase">{selectedOrder.deliveryType}</p>
                        {selectedOrder.deliveryAddress && <p className="text-sm text-neutral-600 font-normal">{selectedOrder.deliveryAddress}</p>}
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-2xl space-y-2 text-indigo-950 font-bold">
                        <p className="text-xs font-bold text-neutral-400 uppercase">Customer Information</p>
                        <p className="text-sm font-bold uppercase">{selectedOrder.customerName}</p>
                        <p className="text-sm text-neutral-600 font-normal">{selectedOrder.customerContact}</p>
                    </div>
                  </section>
                </div>

                {/* Status & Summary */}
                <aside className="space-y-8">
                  <section className="space-y-4">
                      <h3 className="font-bold text-lg">Update Status</h3>
                      <div className="flex flex-col gap-2">
                        {['Pending', 'Confirmed', 'Processing', 'Out For Delivery', 'Delivered', 'Cancelled'].map(s => (
                          <button 
                            key={s}
                            onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-sm font-bold text-left transition-all border",
                              selectedOrder.status === s ? getStatusColor(s) + " border-current" : "border-neutral-100 hover:bg-neutral-50"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                  </section>

                  <section className="bg-indigo-50 p-6 rounded-2xl space-y-4 sticky top-0">
                      <h3 className="font-bold text-neutral-800">Payment Summary</h3>
                      <div className="space-y-2 text-sm text-neutral-600">
                        <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(selectedOrder.subtotal || (selectedOrder.totalAmount - (selectedOrder.deliveryFee || 0)))}</span></div>
                        <div className="flex justify-between"><span>Delivery</span><span>{formatPrice(selectedOrder.deliveryFee || 0)}</span></div>
                        {selectedOrder.discountAmount ? (
                          <div className="flex justify-between text-emerald-600">
                            <span>Discount {selectedOrder.promoCode ? `(${selectedOrder.promoCode})` : ''}</span>
                            <span>-{formatPrice(selectedOrder.discountAmount)}</span>
                          </div>
                        ) : null}
                        <div className="flex justify-between pt-2 border-t border-indigo-100 font-bold text-neutral-900 text-lg">
                            <span>Total</span><span>{formatPrice(selectedOrder.totalAmount)}</span>
                        </div>
                      </div>
                      <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-4">
                          <CheckCircle2 size={18} /> Print Invoice
                      </button>
                  </section>
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const X = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
