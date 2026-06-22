/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import { useDocument } from '../hooks/useFirebase';
import { Product, AdminSettings } from '../types';
import { formatPrice } from '../lib/utils';
import { useCart } from '../context/CartContext';
import BargainChat from '../components/BargainChat';
import { motion } from 'motion/react';

export default function ProductPage() {
  const { id } = useParams();
  const { data: product, loading } = useDocument<Product>('products', id);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isBargainChatOpen, setIsBargainChatOpen] = useState(false);
  const { addToCart } = useCart();
  const { data: settings } = useDocument<AdminSettings>('settings', 'store');

  const handleWhatsApp = () => {
    if (!settings?.whatsappNumber) return;
    const msg = encodeURIComponent(`Hello, I am interested in bargaining for ${product.name} on GraceStore.`);
    window.open(`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  if (loading) return <div className="h-96 flex items-center justify-center">Loading product...</div>;
  if (!product) return <div className="h-96 flex items-center justify-center">Product not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Gallery */}
        <div className="w-full lg:w-1/2 space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-100">
            <img 
              src={product.images[activeImage]} 
              className="w-full h-full object-cover" 
              alt={product.name}
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images?.map((img, i) => (
              <button 
                key={i}
                onClick={() => setActiveImage(i)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${activeImage === i ? 'border-indigo-600 ring-2 ring-indigo-50' : 'border-transparent'}`}
              >
                <img src={img} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="w-full lg:w-1/2 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <h1 className="text-4xl font-bold tracking-tight">{product.name}</h1>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-neutral-100 rounded-full border border-neutral-200"><Heart size={20} /></button>
                <button className="p-2 hover:bg-neutral-100 rounded-full border border-neutral-200"><Share2 size={20} /></button>
              </div>
            </div>
            <p className="text-3xl font-bold text-indigo-600">{formatPrice(product.price)}</p>
            <p className="text-neutral-600 leading-relaxed text-lg">{product.description}</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-neutral-200 rounded-xl">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-neutral-100 rounded-l-xl"
                >-</button>
                <span className="px-4 py-2 font-semibold w-12 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-neutral-100 rounded-r-xl"
                >+</button>
              </div>
              <button 
                onClick={() => addToCart(product, quantity)}
                className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 transition-all"
              >
                <ShoppingCart size={22} /> Add to Cart — {formatPrice(product.price * quantity)}
              </button>
            </div>

            <div className="flex flex-col gap-3">
               <button 
                 onClick={handleWhatsApp}
                 className="w-full border-2 border-green-500 text-green-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-50 transition-colors"
               >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.767 5.767 0 1.2.369 2.321 1.003 3.25l-.78 2.846 2.914-.764a5.733 5.733 0 0 0 2.63.635c3.181 0 5.767-2.586 5.767-5.767 0-3.181-2.586-5.767-5.767-5.767zm3.39 8.2c-.147.414-.733.755-1.014.8-.282.045-.515.111-1.748-.387-.604-.244-1.127-.557-1.554-.925-.333-.287-.624-.583-.872-.888l-.053-.066c-.198-.249-.364-.462-.495-.644-.452-.63-.733-1.114-.799-1.42s-.036-.54.126-.819c.162-.279.432-.324.522-.324.089 0 .179 0 .269.015.093.003.111-.003.18.165.09.219.309.753.336.81l.019.043c.026.059.043.111.015.168s-.044.088-.135.2c-.09.111-.18.196-.269.3-.091.104-.187.218-.081.4.106.183.473.782.102 1.37-.101.161-.256.326-.432.502s-.361.353-.551.527c-.201.183-.396.345-.558.468C8.5 15 9.5 15.5 10.5 15.7c.3.06.63.1.99.11.36.01.73-.01 1.1-.06.37-.05.74-.13 1.1-.25.36-.12.69-.28.98-.48.29-.2.53-.44.7-.72.17-.28.27-.6.29-.96.02-.36-.04-.75-.18-1.17-.14-.42-.36-.88-.65-1.38l-.06-.1c-.13-.23-.3-.52-.45-.78-.15-.26-.33-.56-.37-.58-.04-.02-.13-.02-.27 0s-.32.06-.54.12c-.22.06-.48.16-.78.3-.3.14-.64.33-.87.49-.23.16-.39.29-.39.29s.2-.1.52-.25c.32-.15.7-.35 1.02-.45s.6-.14.65-.12c.05.02.13.1.2.18s.16.2.22.33c.06.13.12.28.16.44s.06.33.06.51c0 .18-.03.38-.07.6-.04.22-.1.45-.18.68s-.18.47-.3.7c-.12.23-.26.46-.42.68s-.33.43-.53.62c-.2.19-.42.36-.66.52s-.5.3-.77.42c-.27.12-.56.22-.86.29-.3.07-.61.12-.94.14-.33.02-.68.01-1.04-.02-.36-.03-.73-.09-1.1-.18-.37-.09-.75-.21-1.13-.36-.38-.15-.76-.33-1.14-.54s-.75-.46-1.11-.73c-.36-.27-.71-.58-1-.91s-.58-.7-.82-1.08c-.24-.38-.45-.79-.62-1.22s-.3-.88-.41-1.36l-.02-.08c-.1-.48-.15-1-.15-1.53 0-4.032 3.28-7.312 7.312-7.312a7.29 7.29 0 0 1 5.17 2.146 7.29 7.29 0 0 1 2.146 5.17c0 4.032-3.28 7.312-7.312 7.312z"/></svg>
                Bargain on WhatsApp
              </button>
               <button 
                 onClick={() => setIsBargainChatOpen(true)}
                 className="w-full bg-indigo-50 text-indigo-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
               >
                 Chat With Seller
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-neutral-100">
            {[
              { icon: <Truck size={20} />, title: 'Doorstep Delivery', desc: 'Available in Ashaiman area' },
              { icon: <ShieldCheck size={20} />, title: 'Payment Protected', desc: 'Secure checkout' },
              { icon: <RefreshCcw size={20} />, title: 'Easy Returns', desc: '7-day return policy' },
              { icon: <Heart size={20} />, title: 'Genuine Products', desc: '100% Quality guaranteed' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">{item.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-neutral-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isBargainChatOpen && (
        <BargainChat isModal onClose={() => setIsBargainChatOpen(false)} />
      )}
    </div>
  );
}
