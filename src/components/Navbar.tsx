/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { AdminSettings } from '../types';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [storeName, setStoreName] = useState('GraceStore');
  const { profile, isAdmin } = useAuth();
  const { itemCount } = useCart();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'store'));
        if (docSnap.exists()) {
          const data = docSnap.data() as AdminSettings;
          if (data.storeName) setStoreName(data.storeName);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleLogout = () => auth.signOut();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tight text-indigo-600">{storeName}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium hover:text-indigo-600">Home</Link>
            <Link to="/shop" className="text-sm font-medium hover:text-indigo-600">Shop</Link>
            {isAdmin && (
              <Link to="/admin" className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1">
                <LayoutDashboard size={16} /> Admin
              </Link>
            )}
          </div>

          {/* Icons */}
          <div className="hidden md:flex items-center space-x-5">
            <Link to="/shop" className="p-2 hover:bg-neutral-100 rounded-full">
              <Search size={20} />
            </Link>
            <Link to="/cart" className="p-2 hover:bg-neutral-100 rounded-full relative">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>
            {profile ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="flex items-center gap-2 p-2 hover:bg-neutral-100 rounded-full">
                  <User size={20} />
                  <span className="text-sm font-medium">{profile.name.split(' ')[0]}</span>
                </Link>
                <button onClick={handleLogout} className="p-2 hover:bg-neutral-100 rounded-full text-red-500">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
             <Link to="/cart" className="p-2 hover:bg-neutral-100 rounded-full relative">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-neutral-100 rounded-lg"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={cn(
        "md:hidden absolute w-full bg-white border-b border-neutral-200 transition-all duration-200",
        isMenuOpen ? "max-h-screen opacity-100 py-4" : "max-h-0 opacity-0 overflow-hidden"
      )}>
        <div className="px-4 space-y-4">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium">Home</Link>
          <Link to="/shop" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium">Shop</Link>
          {isAdmin && (
             <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-amber-600">Admin Dashboard</Link>
          )}
          <hr />
          {profile ? (
            <>
              <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium">My Profile</Link>
              <button onClick={handleLogout} className="w-full text-left text-lg font-medium text-red-500">Log Out</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-indigo-600">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
