/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, cartTotal, itemCount } = useCart();

  if (itemCount === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <div className="mx-auto w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-3xl font-bold">Your cart is empty</h2>
        <p className="text-neutral-500 max-w-md mx-auto">
          Look like you haven't added anything to your cart yet. Explore our products and find something you love!
        </p>
        <Link to="/shop" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart ({itemCount} items)</h1>
      
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items */}
        <div className="flex-grow space-y-6">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div 
                key={item.productId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex gap-6 p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-neutral-50">
                  <img src={item.product?.images[0]} className="w-full h-full object-cover" alt={item.product?.name} />
                </div>
                <div className="flex-grow flex flex-col justify-between py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{item.product?.name}</h3>
                      <p className="text-sm text-neutral-500">Unit Price: {formatPrice(item.product?.price || 0)}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.productId)}
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="flex items-center border border-neutral-200 rounded-lg">
                      <button 
                         onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                         className="p-1 hover:bg-neutral-100 rounded-l-lg transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 hover:bg-neutral-100 rounded-r-lg transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="font-bold text-lg">{formatPrice((item.product?.price || 0) * item.quantity)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <aside className="w-full lg:w-96">
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm sticky top-24 space-y-6">
            <h2 className="text-xl font-bold">Order Summary</h2>
            
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Delivery</span>
                <span className="text-sm italic">Calculated at checkout</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-4 border-t border-neutral-100">
                <span>Total</span>
                <span className="text-indigo-600">{formatPrice(cartTotal)}</span>
              </div>
            </div>

            <Link 
              to="/checkout" 
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
            >
              Proceed to Checkout <ArrowRight size={20} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
