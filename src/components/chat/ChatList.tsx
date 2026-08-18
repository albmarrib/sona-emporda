import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiTrash2 } from 'react-icons/fi';
import type { ChatRoom } from '../../types/chat';

interface ChatListProps {
  chats: ChatRoom[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  getOtherParticipantName: (chat: ChatRoom) => string;
  unreadByChat?: Record<string, number>;
  onDeleteChat?: (chatId: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ chats, activeChatId, onSelectChat, getOtherParticipantName, unreadByChat, onDeleteChat }) => {
  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-white/10 overflow-y-auto">
      <div className="p-4 border-b border-white/10 sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <h2 className="text-xl font-serif text-white">Mensajes</h2>
      </div>
      
      {chats.length === 0 ? (
        <div className="p-6 text-center text-white/40 text-sm">
          No tienes conversaciones activas.
        </div>
      ) : (
        <div className="flex flex-col">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`flex flex-col p-4 border-b border-white/5 text-left transition-colors ${
                activeChatId === chat.id ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center min-w-0 pr-2">
                  <span className="font-bold text-sm text-gold truncate">
                    {getOtherParticipantName(chat)}
                  </span>
                  {unreadByChat?.[chat.id] ? (
                    <span className="ml-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shrink-0">
                      {unreadByChat[chat.id]}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] text-white/40 shrink-0 mt-0.5">
                  {chat.updatedAt ? format(new Date(chat.updatedAt), 'd MMM HH:mm', { locale: es }) : ''}
                </span>
              </div>
              <div className="flex justify-between items-center w-full mt-1">
                <p className="text-xs text-white/60 truncate flex-1 pr-2">
                  {chat.lastMessage || 'Conversación iniciada'}
                </p>
                {onDeleteChat && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("¿Seguro que quieres eliminar este chat de tu lista?")) {
                        onDeleteChat(chat.id);
                      }
                    }}
                    className="text-white/20 hover:text-red-500 transition-colors shrink-0 p-1"
                    title="Eliminar Chat"
                  >
                    <FiTrash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
