/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { ArrowRight, Truck, ShieldCheck, Heart, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AdminSettings } from '../types';

const categories = [
  { name: 'Fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80', path: '/shop?cat=fashion' },
  { name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80', path: '/shop?cat=electronics' },
  { name: 'Home Decor', image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80', path: '/shop?cat=home' },
  { name: 'Accessories', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80', path: '/shop?cat=accessories' },
];

export default function HomePage() {
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

  const storeName = settings?.storeName || 'GraceStore';
  const displayLocation = settings?.storeAddress ? settings.storeAddress.split(',')[0] : 'Ashaiman';

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center overflow-hidden bg-neutral-900">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover opacity-60"
            alt="Hero background"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl text-white space-y-6"
          >
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              {storeName} <br />
              <span className="text-indigo-400">Elegance Redefined</span>
            </h1>
            <p className="text-lg text-neutral-200">
              Discover a curated collection of premium products, specifically selected for your lifestyle. Now delivering exclusively in {displayLocation}.
            </p>
            <div className="flex gap-4">
              <Link to="/shop" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all">
                Shop Now <ArrowRight size={20} />
              </Link>
              <Link to="/dashboard" className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-8 py-3 rounded-lg font-semibold transition-all">
                Track Order
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: <Truck className="text-indigo-600" />, title: 'Fast Delivery', desc: `Swift delivery within ${displayLocation}` },
            { icon: <ShieldCheck className="text-indigo-600" />, title: 'Secure Payment', desc: 'Your security is our priority' },
            { icon: <Heart className="text-indigo-600" />, title: 'Premium Quality', desc: 'Handpicked products of excellence' },
            { icon: <Clock className="text-indigo-600" />, title: '24/7 Support', desc: 'Expert assistance when you need' },
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm border border-neutral-100">
              <div className="p-3 bg-indigo-50 rounded-full mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-neutral-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold">Shop by Category</h2>
            <p className="text-neutral-500">Pick from our carefully curated sections</p>
          </div>
          <Link to="/shop" className="text-indigo-600 font-semibold hover:underline flex items-center gap-1">
            Browse All <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((c, i) => (
            <Link key={i} to={c.path} className="group relative h-80 rounded-2xl overflow-hidden drop-shadow-md">
              <img 
                src={c.image} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                alt={c.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                <h3 className="text-white text-xl font-bold">{c.name}</h3>
                <p className="text-neutral-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity">Explore collection</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-indigo-600 rounded-3xl p-12 text-center text-white space-y-6">
          <h2 className="text-4xl font-bold">Ready to Bargain?</h2>
          <p className="text-indigo-100 max-w-2xl mx-auto">
            Not sure about the price? Use our unique bargaining system to talk directly with us on WhatsApp or through our built-in chat system.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <button className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold hover:bg-neutral-100 transition-colors">
              Start Bargaining
            </button>
            <button className="bg-indigo-500 text-white border border-indigo-400 px-8 py-3 rounded-xl font-bold hover:bg-indigo-400 transition-colors">
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
