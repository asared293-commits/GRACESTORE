/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, Send, Clock, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AdminSettings } from '../types';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'store'));
        if (docSnap.exists()) {
          setSettings(docSnap.data() as AdminSettings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'newsletter'), {
        email: email.trim(),
        createdAt: new Date().toISOString()
      });
      toast.success('Successfully subscribed to our newsletter!');
      setEmail('');
    } catch (error) {
      console.error('Newsletter error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <h3 className="text-2xl font-bold text-white">{settings?.storeName || 'GraceStore'}</h3>
            <p className="text-sm leading-relaxed">
              Modern online marketplace for the finest products. 
              {settings?.storeAddress ? `Delivering excellence right to your doorstep in ${settings.storeAddress.split(',')[0]}.` : 'Delivering excellence right to your doorstep.'}
            </p>
            <div className="flex space-x-4">
              <Instagram size={20} className="cursor-pointer hover:text-white transition-colors" />
              <Facebook size={20} className="cursor-pointer hover:text-white transition-colors" />
              <Twitter size={20} className="cursor-pointer hover:text-white transition-colors" />
              {settings?.whatsappNumber && (
                <a 
                  href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-emerald-500 transition-colors"
                >
                  <MessageCircle size={20} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h4 className="text-white font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="hover:text-white">All Products</Link></li>
              <li><Link to="/shop?category=fashion" className="hover:text-white">Fashion</Link></li>
              <li><Link to="/shop?category=electronics" className="hover:text-white">Electronics</Link></li>
              <li><Link to="/shop?category=home" className="hover:text-white">Home & Living</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-1">
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
              <li><Link to="/dashboard" className="hover:text-white">Order Tracking</Link></li>
              <li><Link to="/faq" className="hover:text-white">FAQs</Link></li>
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-1">
            <h4 className="text-white font-semibold mb-4">Store Info</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-indigo-500 shrink-0" />
                <span>{settings?.storeAddress || 'Ashaiman Central, Accra'}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-indigo-500 shrink-0" />
                <span>{settings?.phoneNumber || '+233 24 123 4567'}</span>
              </li>
              {settings?.businessEmail && (
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-indigo-500 shrink-0" />
                  <span className="truncate">{settings.businessEmail}</span>
                </li>
              )}
              {settings?.businessHours && (
                <li className="flex items-center gap-3">
                  <Clock size={18} className="text-indigo-500 shrink-0" />
                  <span>{settings.businessHours}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-1 space-y-4">
            <h4 className="text-white font-semibold">Join Newsletter</h4>
            <p className="text-xs text-neutral-400">Get the latest updates on new products and upcoming sales.</p>
            <form onSubmit={handleNewsletter} className="group flex overflow-hidden rounded-xl border border-neutral-700 focus-within:border-indigo-500 transition-colors">
               <input 
                 type="email" 
                 value={email}
                 onChange={e => setEmail(e.target.value)}
                 placeholder="Email address" 
                 required
                 className="flex-grow px-3 py-2 bg-transparent text-sm outline-none placeholder:text-neutral-500"
               />
               <button 
                 disabled={loading}
                 className="bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
               >
                 <Send size={16} />
               </button>
            </form>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-neutral-800 text-center text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} {settings?.storeName || 'GraceStore'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
