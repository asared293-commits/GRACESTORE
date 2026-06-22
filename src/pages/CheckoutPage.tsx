/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Truck, Store, MessageSquare, AlertCircle, CheckCircle, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatPrice, calculateDistance } from '../lib/utils';
import LocationPicker from '../components/LocationPicker';
import BargainChat from '../components/BargainChat';
import { AdminSettings, Promo } from '../types';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { profile } = useAuth();
  const { items, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup' | 'bargain'>('delivery');
  const [isBargainChatOpen, setIsBargainChatOpen] = useState(false);
  const [locationMode, setLocationMode] = useState<'gps' | 'manual' | null>(null);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [storeSettings, setStoreSettings] = useState<AdminSettings | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isAshaiman, setIsAshaiman] = useState(true);
  const [loading, setLoading] = useState(false);

  // Promo states
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);
  const [promoError, setPromoError] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, 'settings', 'store'));
      if (docSnap.exists()) {
        setStoreSettings(docSnap.data() as AdminSettings);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (deliveryType === 'delivery' && coords && storeSettings) {
      const dist = calculateDistance(coords.lat, coords.lng, storeSettings.lat, storeSettings.lng);
      setDistance(dist);
      setDeliveryFee(dist <= 5 ? 7 : 15);

      const addrLower = address.toLowerCase();
      const inAsh = addrLower.includes('ashaiman') || addrLower.includes('ashman') || addrLower.includes('tema'); 
      setIsAshaiman(inAsh);
    } else {
      setDeliveryFee(0);
      setDistance(0);
      setIsAshaiman(true);
    }
  }, [coords, address, deliveryType, storeSettings]);

  useEffect(() => {
    if (appliedPromo) {
      if (appliedPromo.minOrderAmount && cartTotal < appliedPromo.minOrderAmount) {
        setAppliedPromo(null);
        setDiscountAmount(0);
        setPromoError(`Minimum order amount of GHS ${appliedPromo.minOrderAmount} no longer met`);
        return;
      }

      let discount = 0;
      if (appliedPromo.discountType === 'percentage') {
        discount = (cartTotal * appliedPromo.discountValue) / 100;
      } else {
        discount = appliedPromo.discountValue;
      }
      setDiscountAmount(Math.min(discount, cartTotal));
    }
  }, [appliedPromo, cartTotal]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoError('');
    
    try {
      const q = query(
        collection(db, 'promos'), 
        where('code', '==', promoInput.trim().toUpperCase()), 
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setPromoError('Invalid or expired promo code');
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      const promoData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Promo;
      
      if (promoData.minOrderAmount && cartTotal < promoData.minOrderAmount) {
        setPromoError(`Minimum order amount of GHS ${promoData.minOrderAmount} required`);
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      setAppliedPromo(promoData);
      toast.success('Promo code applied!');
    } catch (err) {
      console.error(err);
      setPromoError('Error checking promo code');
    }
  };

  const grandTotal = Math.max(0, cartTotal + deliveryFee - discountAmount);

  const handlePlaceOrder = async () => {
    if (!profile) return;
    if (deliveryType === 'delivery' && !isAshaiman) {
      toast.error('Delivery is only available in Ashaiman');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        userId: profile.uid,
        customerName: profile.name,
        customerContact: profile.phone || profile.email,
        deliveryType,
        deliveryAddress: address,
        lat: coords?.lat || null,
        lng: coords?.lng || null,
        distanceFromStore: distance,
        status: 'Pending',
        totalAmount: grandTotal,
        subtotal: cartTotal,
        deliveryFee,
        discountAmount,
        promoCode: appliedPromo?.code || null,
        previewImage: items[0]?.product?.images[0] || null,
        itemCount: items.length,
        createdAt: new Date().toISOString(),
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      for (const item of items) {
        await addDoc(collection(db, 'orders', orderRef.id, 'items'), {
          productId: item.productId,
          name: item.product?.name,
          price: item.product?.price,
          quantity: item.quantity,
          image: item.product?.images[0],
        });
      }

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Receive Method */}
          <section className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
            <h2 className="text-xl font-bold">How would you like to receive your order?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'delivery', icon: <Truck />, label: 'Delivery' },
                { id: 'pickup', icon: <Store />, label: 'Pickup' },
                { id: 'bargain', icon: <MessageSquare />, label: 'Bargain' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setDeliveryType(m.id as any)}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${deliveryType === m.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-neutral-100 hover:border-neutral-200'}`}
                >
                  {m.icon}
                  <span className="font-semibold">{m.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Delivery Location */}
          {deliveryType === 'delivery' && (
            <section className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4">
              <h2 className="text-xl font-bold">Delivery Location</h2>
              
              {!locationMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setLocationMode('gps')}
                    className="p-6 border-2 border-dashed border-neutral-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all flex flex-col items-center gap-3"
                  >
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full"><Navigation size={24} /></div>
                    <div className="text-center">
                       <p className="font-bold">Use Current Location</p>
                       <p className="text-xs text-neutral-500">Auto-detect using GPS</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setLocationMode('manual')}
                    className="p-6 border-2 border-dashed border-neutral-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all flex flex-col items-center gap-3"
                  >
                    <div className="p-3 bg-neutral-100 text-neutral-600 rounded-full"><MapPin size={24} /></div>
                    <div className="text-center">
                       <p className="font-bold">Enter Manually</p>
                       <p className="text-xs text-neutral-500">Type address or pick on map</p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-neutral-500">
                      {locationMode === 'gps' ? 'Detecting your location...' : 'Type your delivery address'}
                    </p>
                    <button onClick={() => { setLocationMode(null); setCoords(null); setAddress(''); }} className="text-indigo-600 text-xs font-bold hover:underline">Change Method</button>
                  </div>

                  {!isAshaiman && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg flex gap-2 items-center text-sm">
                      <AlertCircle size={18} />
                      Sorry, delivery is currently available only within Ashaiman.
                    </div>
                  )}

                  <LocationPicker 
                    autoDetect={locationMode === 'gps'}
                    storeCoords={storeSettings ? { lat: storeSettings.lat, lng: storeSettings.lng } : undefined}
                    onLocationSelect={(lat, lng, addr) => {
                      setCoords({ lat, lng });
                      setAddress(addr);
                    }} 
                  />

                  {coords && (
                    <div className="p-4 bg-indigo-50 rounded-xl space-y-2 border border-indigo-100">
                      <div className="flex justify-between">
                         <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Verified Address</span>
                         <span className="text-xs text-indigo-600 font-bold">{distance.toFixed(2)} km away</span>
                      </div>
                      <p className="text-sm font-medium text-indigo-950">{address}</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Pickup Info */}
          {deliveryType === 'pickup' && (
             <section className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4">
               <h2 className="text-xl font-bold">Store Location for Pickup</h2>
               {storeSettings ? (
                 <div className="space-y-4">
                    <div className="p-4 bg-neutral-50 rounded-xl space-y-2">
                       <p className="font-bold">{storeSettings.storeName}</p>
                       <p className="text-sm text-neutral-600 flex items-center gap-2"><MapPin size={14} /> {storeSettings.storeAddress}</p>
                       <p className="text-sm text-neutral-600">Hours: {storeSettings.businessHours}</p>
                    </div>
                    <div className="h-48 bg-neutral-100 rounded-xl overflow-hidden">
                       {/* Static preview or just a generic map if needed */}
                       <div className="w-full h-full flex items-center justify-center text-neutral-400 italic text-sm">Interactive map available on order confirmation</div>
                    </div>
                 </div>
               ) : (
                 <p className="text-neutral-500 italic">Store location details loading...</p>
               )}
             </section>
          )}

           {/* Bargain Mode */}
           {deliveryType === 'bargain' && (
            <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                   <MessageSquare size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-bold">Negotiate Price</h2>
                   <p className="text-sm text-neutral-500">Contact the seller to agree on a final price before placing your order request.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <button 
                   onClick={() => setIsBargainChatOpen(true)}
                   className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                 >
                    <MessageSquare size={18} /> Open Live Chat
                 </button>
                 <button 
                   onClick={() => {
                     const num = storeSettings?.whatsappNumber.replace(/\D/g, '');
                     const msg = encodeURIComponent("Hello, I'd like to bargain for the items in my cart at GraceStore.");
                     window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
                   }}
                   className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                 >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.767 5.767 0 1.2.369 2.321 1.003 3.25l-.78 2.846 2.914-.764a5.733 5.733 0 0 0 2.63.635c3.181 0 5.767-2.586 5.767-5.767 0-3.181-2.586-5.767-5.767-5.767zm3.39 8.2c-.147.414-.733.755-1.014.8-.282.045-.515.111-1.748-.387-.604-.244-1.127-.557-1.554-.925-.333-.287-.624-.583-.872-.888l-.053-.066c-.198-.249-.364-.462-.495-.644-.452-.63-.733-1.114-.799-1.42s-.036-.54.126-.819c.162-.279.432-.324.522-.324.089 0 .179 0 .269.015.093.003.111-.003.18.165.09.219.309.753.336.81l.019.043c.026.059.043.111.015.168s-.044.088-.135.2c-.09.111-.18.196-.269.3-.091.104-.187.218-.081.4.106.183.473.782.102 1.37-.101.161-.256.326-.432.502s-.361.353-.551.527c-.201.183-.396.345-.558.468C8.5 15 9.5 15.5 10.5 15.7c.3.06.63.1.99.11.36.01.73-.01 1.1-.06.37-.05.74-.13 1.1-.25.36-.12.69-.28.98-.48.29-.2.53-.44.7-.72.17-.28.27-.6.29-.96.02-.36-.04-.75-.18-1.17-.14-.42-.36-.88-.65-1.38l-.06-.1c-.13-.23-.3-.52-.45-.78-.15-.26-.33-.56-.37-.58-.04-.02-.13-.02-.27 0s-.32.06-.54.12c-.22.06-.48.16-.78.3-.3.14-.64.33-.87.49-.23.16-.39.29-.39.29s.2-.1.52-.25c.32-.15.7-.35 1.02-.45s.6-.14.65-.12c.05.02.13.1.2.18s.16.2.22.33c.06.13.12.28.16.44s.06.33.06.51c0 .18-.03.38-.07.6-.04.22-.1.45-.18.68s-.18.47-.3.7c-.12.23-.26.46-.42.68s-.33.43-.53.62c-.2.19-.42.36-.66.52s-.5.3-.77.42c-.27.12-.56.22-.86.29-.3.07-.61.12-.94.14-.33.02-.68.01-1.04-.02-.36-.03-.73-.09-1.1-.18-.37-.09-.75-.21-1.13-.36-.38-.15-.76-.33-1.14-.54s-.75-.46-1.11-.73c-.36-.27-.71-.58-1-.91s-.58-.7-.82-1.08c-.24-.38-.45-.79-.62-1.22s-.3-.88-.41-1.36l-.02-.08c-.1-.48-.15-1-.15-1.53 0-4.032 3.28-7.312 7.312-7.312a7.29 7.29 0 0 1 5.17 2.146 7.29 7.29 0 0 1 2.146 5.17c0 4.032-3.28 7.312-7.312 7.312z"/></svg> WhatsApp Chat
                 </button>
              </div>

              <div className="p-4 bg-neutral-50 rounded-xl">
                 <p className="text-xs text-neutral-500 italic">Note: After bargaining, we will provide you with a custom checkout link or update your order total manually.</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-bold">Order Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-neutral-600">
                <span>Items Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Delivery Fee</span>
                <span>{deliveryType === 'delivery' ? formatPrice(deliveryFee) : 'FREE'}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount ({appliedPromo?.code})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl pt-4 border-t border-neutral-100">
                <span>Grand Total</span>
                <span className="text-indigo-600">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="pt-4 space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Promo Code</label>
              <div className="flex gap-2">
                <input 
                  value={promoInput}
                  onChange={e => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-grow p-3 rounded-xl border border-neutral-200 text-sm font-mono"
                />
                <button 
                  onClick={handleApplyPromo}
                  className="px-4 py-3 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all"
                >
                  Apply
                </button>
              </div>
              {promoError && <p className="text-[10px] text-rose-500 font-bold">{promoError}</p>}
              {appliedPromo && (
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle size={10} /> Promo applied successfully!
                </p>
              )}
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading || (deliveryType === 'delivery' && (!coords || !isAshaiman))}
              className={`w-full py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${deliveryType === 'bargain' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100' : 'bg-neutral-900 text-white hover:bg-neutral-800'}`}
            >
              {loading ? 'Processing...' : deliveryType === 'bargain' ? 'Send Bargain Request' : 'Place Order'}
            </button>
            <p className="text-center text-[10px] text-neutral-400">By placing an order, you agree to GraceStore's Terms of Service.</p>
          </div>
        </aside>
      </div>

      {isBargainChatOpen && (
        <BargainChat isModal onClose={() => setIsBargainChatOpen(false)} />
      )}
    </div>
  );
}
