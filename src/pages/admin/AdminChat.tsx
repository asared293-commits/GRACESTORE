/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCollection } from '../../hooks/useFirebase';
import { Conversation, Message } from '../../types';
import { db } from '../../lib/firebase';
import { collection, addDoc, orderBy, query, where, doc, setDoc } from 'firebase/firestore';
import { Send, Image as ImageIcon, User, Search, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export default function AdminChat() {
  const { profile } = useAuth();
  const { data: conversations } = useCollection<Conversation>('conversations', [orderBy('updatedAt', 'desc')]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const { data: messages } = useCollection<Message>(
    selectedConv ? `conversations/${selectedConv.id}/messages` : '', 
    [orderBy('createdAt', 'asc')]
  );
  
  const [inputText, setInputText] = useState('');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv || !profile) return;

    const msg = {
      senderId: profile.uid,
      text: inputText,
      createdAt: new Date().toISOString(),
    };

    const conversationId = selectedConv.id;
    const recipientId = selectedConv.userId;
    const text = inputText;

    setInputText('');
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), msg);
    
    // Update last message in conversation
    await setDoc(doc(db, 'conversations', conversationId), {
      lastMessage: text,
      updatedAt: new Date().toISOString(),
      unreadCount: 0 // Resetting since admin just replied (or you could increment customer's unread count)
    }, { merge: true });

    // Create notification for the user
    await addDoc(collection(db, 'notifications'), {
      userId: recipientId,
      title: 'New Message from Store',
      message: text.length > 50 ? text.substring(0, 50) + '...' : text,
      type: 'chat',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/dashboard'
    });
  };

  return (
    <div className="h-[calc(100vh-140px)] bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden flex">
      {/* List */}
      <aside className="w-80 border-r border-neutral-100 flex flex-col">
        <div className="p-6 border-b border-neutral-100">
          <h2 className="text-xl font-bold mb-4">Conversations</h2>
          <div className="relative">
             <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-neutral-50 rounded-xl text-sm border border-transparent focus:border-indigo-500 outline-none" />
             <Search size={16} className="absolute left-3 top-2.5 text-neutral-400" />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {conversations?.map(conv => (
            <button 
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              className={cn(
                "w-full p-4 flex gap-4 items-center hover:bg-neutral-50 transition-colors border-b border-neutral-50",
                selectedConv?.id === conv.id && "bg-indigo-50 border-indigo-100"
              )}
            >
              <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center shrink-0">
                <User size={24} className="text-neutral-500" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="font-bold truncate text-sm">{conv.userName || `Customer #${conv.userId.slice(0, 5)}`}</p>
                <p className="text-xs text-neutral-500 truncate">{conv.lastMessage || 'Start bargaining...'}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-grow flex flex-col bg-neutral-50/30">
        {selectedConv ? (
          <>
            <header className="p-6 bg-white border-b border-neutral-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold font-mono">
                 {(selectedConv.userName || 'C').charAt(0).toUpperCase()}
              </div>
              <div>
                 <h3 className="font-bold">{selectedConv.userName || `Customer #${selectedConv.userId.slice(0, 5)}`}</h3>
                 <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online</p>
              </div>
            </header>

            <div className="flex-grow overflow-y-auto p-6 space-y-4">
               {messages?.map(msg => {
                 const isMe = msg.senderId === profile?.uid;
                 return (
                   <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[70%] p-4 rounded-2xl text-sm shadow-sm",
                        isMe ? "bg-indigo-600 text-white rounded-br-none" : "bg-white text-neutral-800 rounded-bl-none border border-neutral-100"
                      )}>
                         {msg.text}
                         <p className={cn("text-[9px] mt-1 opacity-70", isMe ? "text-right" : "text-left")}>
                           {format(new Date(msg.createdAt), 'HH:mm')}
                         </p>
                      </div>
                   </div>
                 );
               })}
            </div>

            <footer className="p-6 bg-white border-t border-neutral-100">
               <form onSubmit={handleSendMessage} className="flex gap-4">
                  <button type="button" className="p-3 text-neutral-400 hover:bg-neutral-100 rounded-xl">
                    <ImageIcon size={20} />
                  </button>
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Type a message..." 
                    className="flex-grow px-4 py-3 bg-neutral-50 rounded-xl border border-transparent focus:border-indigo-500 outline-none" 
                  />
                  <button type="submit" className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                    <Send size={20} />
                  </button>
               </form>
            </footer>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-neutral-400 flex-col gap-4">
             <div className="p-6 bg-white rounded-full border border-neutral-100 shadow-sm"><MessageSquare size={48} /></div>
             <p className="font-medium">Select a conversation to start chatting</p>
          </div>
        )}
      </main>
    </div>
  );
}
