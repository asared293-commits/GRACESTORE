/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, SlidersHorizontal, Search } from 'lucide-react';
import { useCollection } from '../hooks/useFirebase';
import { Product, Category } from '../types';
import { formatPrice } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { motion } from 'motion/react';
import { where } from 'firebase/firestore';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCat = searchParams.get('cat') || 'all';
  const queryText = searchParams.get('q') || '';
  
  const { data: categories = [] } = useCollection<Category>('categories');
  const { data: products = [], loading } = useCollection<Product>('products', [
    where('status', '==', 'active')
  ]);
  
  const { addToCart } = useCart();

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCat === 'all' || p.categoryId === selectedCat;
    const matchesQuery = p.name.toLowerCase().includes(queryText.toLowerCase()) || 
                         p.description.toLowerCase().includes(queryText.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <SlidersHorizontal size={20} /> Categories
            </h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setSearchParams({ cat: 'all', q: queryText })}
                className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCat === 'all' ? 'bg-indigo-600 text-white' : 'hover:bg-neutral-100'}`}
              >
                All Products
              </button>
              {categories?.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSearchParams({ cat: cat.name.toLowerCase(), q: queryText })}
                  className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCat === cat.name.toLowerCase() ? 'bg-indigo-600 text-white' : 'hover:bg-neutral-100'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-6 bg-indigo-600 rounded-2xl text-white">
            <h4 className="font-bold mb-2">Exclusive Offer</h4>
            <p className="text-sm text-indigo-100 mb-4">Get 10% off on your first order inside Ashaman.</p>
            <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold w-full uppercase tracking-wider">
              Apply Code
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-grow space-y-8">
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold">
              {queryText ? `Results for "${queryText}"` : selectedCat === 'all' ? 'All Products' : categories.find(c => c.name.toLowerCase() === selectedCat)?.name}
            </h2>
            
            <div className="relative w-full md:w-96">
              <input 
                type="text" 
                placeholder="Search products..."
                value={queryText}
                onChange={(e) => setSearchParams({ cat: selectedCat, q: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-neutral-100 rounded-2xl h-96 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((p) => (
                <motion.div 
                  layout
                  key={p.id}
                  className="group bg-white border border-neutral-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <Link to={`/product/${p.id}`} className="block relative h-64 overflow-hidden">
                    <img 
                      src={p.images[0]} 
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <button className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-red-500">
                      <Heart size={18} />
                    </button>
                  </Link>
                  
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-indigo-600 transition-colors">
                          <Link to={`/product/${p.id}`}>{p.name}</Link>
                        </h3>
                        <p className="text-sm text-neutral-500 line-clamp-1">{p.description}</p>
                      </div>
                      <p className="font-bold text-indigo-600">{formatPrice(p.price)}</p>
                    </div>
                    
                    <button 
                      onClick={() => addToCart(p)}
                      className="w-full bg-neutral-900 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
                    >
                      <ShoppingCart size={18} /> Add to Cart
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-200">
              <Search className="mx-auto text-neutral-300 mb-4" size={48} />
              <p className="text-xl font-medium text-neutral-500">No products found</p>
              <button 
                onClick={() => setSearchParams({ cat: 'all', q: '' })}
                className="mt-4 text-indigo-600 font-semibold"
              >
                Clear all filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
