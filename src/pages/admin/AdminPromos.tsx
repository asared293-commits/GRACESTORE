/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tag, Plus, Trash2, X, Check, Clock } from 'lucide-react';
import { useCollection } from '../../hooks/useFirebase';
import { Promo } from '../../types';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminPromos() {
  const { data: promos = [], loading } = useCollection<Promo>('promos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) return;

    if (promos.some(p => p.code === code.trim().toUpperCase())) {
      toast.error('Promo code already exists');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'promos'), {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
        isActive: true,
        createdAt: new Date().toISOString()
      });
      toast.success('Promo code created!');
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error('Failed to create promo code');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderAmount('');
  };

  const toggleStatus = async (promo: Promo) => {
    try {
      await updateDoc(doc(db, 'promos', promo.id), { isActive: !promo.isActive });
      toast.success('Promo status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const deletePromo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo?')) return;
    try {
      await deleteDoc(doc(db, 'promos', id));
      toast.success('Promo deleted');
    } catch (err) {
      toast.error('Failed to delete promo');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Promo Codes</h1>
          <p className="text-neutral-500">Manage discounts and promotional offers.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} /> Create Promo
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-widest border-b border-neutral-100">
              <th className="px-6 py-4 font-bold text-indigo-900">Code</th>
              <th className="px-6 py-4 font-bold text-indigo-900">Discount</th>
              <th className="px-6 py-4 font-bold text-indigo-900">Min. Order</th>
              <th className="px-6 py-4 font-bold text-indigo-900">Status</th>
              <th className="px-6 py-4 font-bold text-indigo-900">Created</th>
              <th className="px-6 py-4 font-bold text-indigo-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-neutral-400">Loading promos...</td></tr>
            ) : promos.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-neutral-400">No promo codes found.</td></tr>
            ) : (
              promos.map((promo) => (
                <tr key={promo.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold bg-neutral-100 px-2 py-1 rounded-md text-indigo-600">{promo.code}</span>
                  </td>
                  <td className="px-6 py-4 font-bold">
                    {promo.discountValue}{promo.discountType === 'percentage' ? '%' : ' GHS'}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {promo.minOrderAmount ? `GHS ${promo.minOrderAmount}` : 'None'}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleStatus(promo)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${promo.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-400'}`}
                    >
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-xs text-neutral-500">
                    {format(new Date(promo.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => deletePromo(promo.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Create New Promo</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full"><X size={20} /></button>
            </div>

            <form onSubmit={handleAddPromo} className="space-y-4">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-neutral-700">Promo Code</label>
                 <input 
                   required
                   value={code}
                   onChange={e => setCode(e.target.value.toUpperCase())}
                   placeholder="E.G. WELCOME20"
                   className="w-full p-3 rounded-xl border border-neutral-200 uppercase font-mono"
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-neutral-700">Type</label>
                   <select 
                     value={discountType} 
                     onChange={e => setDiscountType(e.target.value as any)}
                     className="w-full p-3 rounded-xl border border-neutral-200"
                   >
                     <option value="percentage">Percentage (%)</option>
                     <option value="fixed">Fixed Amount (GHS)</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-neutral-700">Value</label>
                   <input 
                     type="number"
                     required
                     value={discountValue}
                     onChange={e => setDiscountValue(e.target.value)}
                     className="w-full p-3 rounded-xl border border-neutral-200"
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-sm font-bold text-neutral-700">Min. Order Amount (Optional)</label>
                 <input 
                   type="number"
                   value={minOrderAmount}
                   onChange={e => setMinOrderAmount(e.target.value)}
                   className="w-full p-3 rounded-xl border border-neutral-200"
                   placeholder="0"
                 />
               </div>

               <button 
                 type="submit" 
                 disabled={submitting}
                 className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
               >
                 {submitting ? 'Creating...' : 'Create Promo Code'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
