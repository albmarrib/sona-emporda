import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import type { ChatMessage, ChatRoom } from '../../types/chat';
import { format } from 'date-fns';
import { Send, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';

interface ChatWindowProps {
  chat: ChatRoom;
  onBack: () => void;
  getOtherParticipantName: (chat: ChatRoom) => string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat, onBack, getOtherParticipantName }) => {
  const { currentUser } = useAuth();
  const { sendMessage, setTypingStatus } = useChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!chat.id || !currentUser) return;

    const q = query(
      collection(db, `chats/${chat.id}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      
      setMessages(msgs);
      
      // Mark as read
      msgs.forEach(msg => {
        if (!msg.read && msg.senderId !== currentUser.uid) {
          updateDoc(doc(db, `chats/${chat.id}/messages`, msg.id), { read: true });
        }
      });
    });

    return () => unsubscribe();
  }, [chat.id, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    setTypingStatus(chat.id, true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(chat.id, false);
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage;
    setNewMessage('');
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTypingStatus(chat.id, false);
    
    await sendMessage(chat.id, text);
  };

  const isOtherTyping = Object.keys(chat.typing || {}).some(
    uid => uid !== currentUser?.uid && chat.typing![uid]
  );

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-zinc-950/90 backdrop-blur-sm">
        <button 
          onClick={onBack}
          className="md:hidden text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gold">{getOtherParticipantName(chat)}</h2>
          {chat.eventId && (
            <span className="text-[10px] uppercase tracking-widest text-white/40">Contexto: Evento Sona Empordà</span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = currentUser?.uid === msg.senderId;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  isMe 
                    ? 'bg-gold/20 text-white border border-gold/30 rounded-tr-sm' 
                    : 'bg-zinc-900 text-white border border-white/10 rounded-tl-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
              <span className="text-[9px] text-white/40 mt-1 px-1">
                {format(new Date(msg.createdAt), 'HH:mm')}
              </span>
            </div>
          );
        })}
        
        {isOtherTyping && (
          <div className="flex items-start">
            <div className="bg-zinc-900 text-white border border-white/10 rounded-2xl rounded-tl-sm px-4 py-2 flex gap-1 items-center h-10">
              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-zinc-950">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold/50"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="p-3 bg-gold text-black rounded-full hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
