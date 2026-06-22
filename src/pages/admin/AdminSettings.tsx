/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Save, MapPin, Store, Phone, Mail, Clock } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminSettings as AdminSettingsType } from '../../types';
import LocationPicker from '../../components/LocationPicker';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState<AdminSettingsType>({
    storeName: 'GraceStore',
    storeAddress: 'Ashman Central Market, Ashaiman',
    lat: 5.6885,
    lng: -0.0152,
    whatsappNumber: '+233240000000',
    phoneNumber: '+233240000000',
    businessEmail: 'contact@gracestore.com',
    businessHours: 'Mon - Sat: 8:00 AM - 6:00 PM',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, 'settings', 'store'));
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AdminSettingsType);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'store'), settings);
      toast.success('Settings updated successfully');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="max-w-4xl space-y-10">
      <header>
        <h1 className="text-3xl font-bold">Store Settings</h1>
        <p className="text-neutral-500">Configure your store's identity and operational details.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Identity Section */}
        <section className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2"><Store size={22} className="text-indigo-600" /> Store Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700">Store Name</label>
              <input 
                required 
                value={settings.storeName}
                onChange={e => setSettings({...settings, storeName: e.target.value})}
                className="w-full p-3 rounded-xl border border-neutral-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700">Business Email</label>
              <div className="relative">
                 <Mail size={18} className="absolute left-3 top-3.5 text-neutral-400" />
                 <input 
                   type="email"
                   value={settings.businessEmail}
                   onChange={e => setSettings({...settings, businessEmail: e.target.value})}
                   className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200" 
                 />
              </div>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2"><MapPin size={22} className="text-indigo-600" /> Store Location & Pickup Origin</h2>
          <p className="text-sm text-neutral-500">Set the precise location of your store. This is used for delivery fee calculation and pickup routing.</p>
          <div className="space-y-6">
            <div className="space-y-2">
               <label className="text-sm font-bold text-neutral-700">Full Address</label>
               <input 
                 required 
                 value={settings.storeAddress}
                 onChange={e => setSettings({...settings, storeAddress: e.target.value})}
                 className="w-full p-3 rounded-xl border border-neutral-200"
               />
            </div>
            <LocationPicker 
              initialCoords={{ lat: settings.lat, lng: settings.lng }}
              onLocationSelect={(lat, lng) => setSettings({...settings, lat, lng})}
            />
          </div>
        </section>

        {/* Contact & Hours */}
        <section className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2"><Phone size={22} className="text-indigo-600" /> Communication & Hours</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-sm font-bold text-neutral-700">WhatsApp Number</label>
                 <input 
                   required 
                   value={settings.whatsappNumber}
                   onChange={e => setSettings({...settings, whatsappNumber: e.target.value})}
                   className="w-full p-3 rounded-xl border border-neutral-200"
                   placeholder="+233..."
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-bold text-neutral-700">Phone for Calls</label>
                 <input 
                   required 
                   value={settings.phoneNumber}
                   onChange={e => setSettings({...settings, phoneNumber: e.target.value})}
                   className="w-full p-3 rounded-xl border border-neutral-200"
                 />
              </div>
              <div className="md:col-span-2 space-y-2">
                 <label className="text-sm font-bold text-neutral-700">Business Hours</label>
                 <div className="relative">
                    <Clock size={18} className="absolute left-3 top-3.5 text-neutral-400" />
                    <input 
                      value={settings.businessHours}
                      onChange={e => setSettings({...settings, businessHours: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200" 
                      placeholder="Mon - Fri: 9am - 5pm"
                    />
                 </div>
              </div>
           </div>
        </section>

        <div className="flex justify-end">
           <button type="submit" className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
              <Save size={20} /> Save Changes
           </button>
        </div>
      </form>
    </div>
  );
}
