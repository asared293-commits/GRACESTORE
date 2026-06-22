/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollection, useDocument } from '../hooks/useFirebase';
import { Message, AdminSettings, Conversation } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, orderBy, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { Send, MessageSquare, Phone, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface BargainChatProps {
  onClose?: () => void;
  isModal?: boolean;
}

export default function BargainChat({ onClose, isModal = false }: BargainChatProps) {
  const { profile } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const { data: messages } = useCollection<Message>(
    conversation ? `conversations/${conversation.id}/messages` : 'none',
    [orderBy('createdAt', 'asc')]
  );
  const { data: settings } = useDocument<AdminSettings>('settings', 'store');
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    const fetchConv = async () => {
      const q = query(collection(db, 'conversations'), where('userId', '==', profile.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setConversation({ id: snap.docs[0].id, ...snap.docs[0].data() } as Conversation);
      } else {
        const newConv = {
          userId: profile.uid,
          userName: profile.name,
          lastMessage: '',
          updatedAt: new Date().toISOString(),
          unreadCount: 0,
        };
        const ref = await addDoc(collection(db, 'conversations'), newConv);
        setConversation({ id: ref.id, ...newConv });
      }
    };
    fetchConv();
  }, [profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversation || !profile) return;

    const msg = {
      senderId: profile.uid,
      text: inputText,
      createdAt: new Date().toISOString(),
    };

    const text = inputText;
    setInputText('');
    await addDoc(collection(db, 'conversations', conversation.id, 'messages'), msg);
    await setDoc(doc(db, 'conversations', conversation.id), { 
      lastMessage: text,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleWhatsApp = () => {
    if (!settings?.whatsappNumber) return;
    const msg = encodeURIComponent("Hello, I'd like to bargain for a product on GraceStore.");
    window.open(`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  const chatContent = (
    <div className={cn(
      "bg-white flex flex-col overflow-hidden",
      isModal ? "w-full max-w-lg h-[600px] rounded-3xl shadow-2xl border border-neutral-100" : "w-full h-full"
    )}>
      <header className="p-6 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-inner shrink-0">
            <MessageSquare />
          </div>
          <div>
            <h3 className="font-bold">Bargain Chat</h3>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Support Agent Ready</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={handleWhatsApp} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors" title="Chat on WhatsApp">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.767 5.767 0 1.2.369 2.321 1.003 3.25l-.78 2.846 2.914-.764a5.733 5.733 0 0 0 2.63.635c3.181 0 5.767-2.586 5.767-5.767 0-3.181-2.586-5.767-5.767-5.767zm3.39 8.2c-.147.414-.733.755-1.014.8-.282.045-.515.111-1.748-.387-.604-.244-1.127-.557-1.554-.925-.333-.287-.624-.583-.872-.888l-.053-.066c-.198-.249-.364-.462-.495-.644-.452-.63-.733-1.114-.799-1.42s-.036-.54.126-.819c.162-.279.432-.324.522-.324.089 0 .179 0 .269.015.093.003.111-.003.18.165.09.219.309.753.336.81l.019.043c.026.059.043.111.015.168s-.044.088-.135.2c-.09.111-.18.196-.269.3-.091.104-.187.218-.081.4.106.183.473.782.102 1.37-.101.161-.256.326-.432.502s-.361.353-.551.527c-.201.183-.396.345-.558.468C8.5 15 9.5 15.5 10.5 15.7c.3.06.63.1.99.11.36.01.73-.01 1.1-.06.37-.05.74-.13 1.1-.25.36-.12.69-.28.98-.48.29-.2.53-.44.7-.72.17-.28.27-.6.29-.96.02-.36-.04-.75-.18-1.17-.14-.42-.36-.88-.65-1.38l-.06-.1c-.13-.23-.3-.52-.45-.78-.15-.26-.33-.56-.37-.58-.04-.02-.13-.02-.27 0s-.32.06-.54.12c-.22.06-.48.16-.78.3-.3.14-.64.33-.87.49-.23.16-.39.29-.39.29s.2-.1.52-.25c.32-.15.7-.35 1.02-.45s.6-.14.65-.12c.05.02.13.1.2.18s.16.2.22.33c.06.13.12.28.16.44s.06.33.06.51c0 .18-.03.38-.07.6-.04.22-.1.45-.18.68s-.18.47-.3.7c-.12.23-.26.46-.42.68s-.33.43-.53.62c-.2.19-.42.36-.66.52s-.5.3-.77.42c-.27.12-.56.22-.86.29-.3.07-.61.12-.94.14-.33.02-.68.01-1.04-.02-.36-.03-.73-.09-1.1-.18-.37-.09-.75-.21-1.13-.36-.38-.15-.76-.33-1.14-.54s-.75-.46-1.11-.73c-.36-.27-.71-.58-1-.91s-.58-.7-.82-1.08c-.24-.38-.45-.79-.62-1.22s-.3-.88-.41-1.36l-.02-.08c-.1-.48-.15-1-.15-1.53 0-4.032 3.28-7.312 7.312-7.312a7.29 7.29 0 0 1 5.17 2.146 7.29 7.29 0 0 1 2.146 5.17c0 4.032-3.28 7.312-7.312 7.312z"/></svg>
           </button>
           {onClose && (
             <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
               <X size={20} />
             </button>
           )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-4 bg-neutral-50/20">
                {messages?.map(msg => {
          const isMe = msg.senderId === profile?.uid;
          return (
            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] p-4 rounded-2xl text-sm shadow-sm",
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
        {(!messages || messages.length === 0) && (
          <div className="text-center py-12 space-y-3">
             <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare size={32} />
             </div>
             <p className="text-sm text-neutral-500 font-medium">Start the conversation to discuss pricing or product details.</p>
          </div>
        )}
      </div>

      <footer className="p-6 border-t border-neutral-100">
        <form onSubmit={handleSendMessage} className="flex gap-4">
          <input 
            type="text" 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Type your bargain request..." 
            className="flex-grow px-4 py-3 bg-neutral-100/50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
          />
          <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
         {chatContent}
      </div>
    );
  }

  return chatContent;
}
