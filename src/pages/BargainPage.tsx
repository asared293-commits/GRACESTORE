/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MessageSquare } from 'lucide-react';
import BargainChat from '../components/BargainChat';

export default function BargainPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Contact info */}
        <aside className="space-y-6 lg:col-span-1">
           <div className="p-8 rounded-3xl bg-neutral-900 text-white space-y-6">
              <h2 className="text-2xl font-bold">Talk to us</h2>
              <p className="text-sm opacity-70">We are happy to negotiate prices for bulk orders or loyal customers.</p>
              
              <div className="space-y-4 pt-4">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-xl">
                       <MessageSquare size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">Response Time</p>
                       <p className="text-sm font-bold">Under 5 mins</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-6 bg-white border border-neutral-100 rounded-3xl shadow-sm">
              <h3 className="font-bold mb-4">How it works</h3>
              <ul className="text-sm text-neutral-500 space-y-4">
                 <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs flex items-center justify-center font-bold shrink-0">1</span>
                    <span>Start a chat session on the right</span>
                 </li>
                 <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs flex items-center justify-center font-bold shrink-0">2</span>
                    <span>Name the product and your price</span>
                 </li>
                 <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs flex items-center justify-center font-bold shrink-0">3</span>
                    <span>Get a custom discount code</span>
                 </li>
              </ul>
           </div>
        </aside>

        {/* Website Chat */}
        <main className="lg:col-span-3 rounded-3xl overflow-hidden border border-neutral-100 shadow-sm h-[700px]">
           <BargainChat />
        </main>
      </div>
    </div>
  );
}
