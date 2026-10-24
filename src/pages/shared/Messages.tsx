import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { ChatList } from '../../components/chat/ChatList';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import type { ChatRoom } from '../../types/chat';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';

export const Messages = () => {
  const { chats, unreadByChat, deleteChat, loading } = useChat();
  const { currentUser } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlChatId = searchParams.get('chatId');
  const [activeChatId, setActiveChatId] = useState<string | null>(location.state?.chatId || urlChatId || null);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  
  // Auto-seleccionar primer chat en desktop si no hay ninguno activo
  useEffect(() => {
    if (!activeChatId && chats.length > 0 && window.innerWidth >= 768) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  // Cargar nombres de participantes sin entrar en bucle infinito
  useEffect(() => {
    if (!currentUser || chats.length === 0) return;

    let isMounted = true;

    const fetchNames = async () => {
      const missingIds: string[] = [];
      for (const chat of chats) {
        if (!Array.isArray(chat?.participants)) continue;
        const otherId = chat.participants.find(id => id !== currentUser.uid);
        if (otherId && !participantNames[otherId] && !missingIds.includes(otherId)) {
          missingIds.push(otherId);
        }
      }

      if (missingIds.length === 0) return;

      const fetched: Record<string, string> = {};
      for (const otherId of missingIds) {
        try {
          const docRef = doc(db, 'users', otherId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            fetched[otherId] = data.stageName || data.venueName || data.name || 'Usuario';
          } else {
            fetched[otherId] = 'Usuario Desconocido';
          }
        } catch (e) {
          console.warn(`Error fetching user ${otherId}:`, e);
          fetched[otherId] = 'Usuario';
        }
      }

      if (isMounted && Object.keys(fetched).length > 0) {
        setParticipantNames(prev => ({ ...prev, ...fetched }));
      }
    };

    fetchNames();

    return () => { isMounted = false; };
  }, [chats, currentUser]);

  const getOtherParticipantName = (chat: ChatRoom) => {
    if (!currentUser || !Array.isArray(chat?.participants)) return 'Desconocido';
    const otherId = chat.participants.find(id => id !== currentUser.uid);
    return otherId ? (participantNames[otherId] || 'Cargando...') : 'Desconocido';
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  if (loading && chats.length === 0) {
    return (
      <div className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] w-full items-center justify-center bg-zinc-950 border border-white/10 rounded-xl">
        <div className="flex flex-col items-center gap-3 text-white/50">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest font-semibold">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Error al cargar la mensajería">
      <div className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] w-full bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        {/* Mobile: lista si no hay chat activo, desktop: columna izquierda fija */}
        <div className={`w-full md:w-80 lg:w-96 shrink-0 h-full ${activeChatId ? 'hidden md:block' : 'block'}`}>
          <ChatList 
            chats={chats} 
            activeChatId={activeChatId} 
            onSelectChat={setActiveChatId}
            getOtherParticipantName={getOtherParticipantName}
            unreadByChat={unreadByChat}
            onDeleteChat={async (id) => {
              await deleteChat(id);
              if (activeChatId === id) setActiveChatId(null);
            }}
          />
        </div>

        {/* Ventana de chat activa */}
        <div className={`flex-1 min-w-0 h-full ${!activeChatId ? 'hidden md:block' : 'block'}`}>
          {activeChat ? (
            <ChatWindow 
              chat={activeChat} 
              onBack={() => setActiveChatId(null)} 
              getOtherParticipantName={getOtherParticipantName}
            />
          ) : (
            <div className="hidden md:flex h-full items-center justify-center bg-black/60 p-6">
              <div className="text-center text-white/30 max-w-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gold/60">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-white/80 font-serif text-lg mb-1">Tus Conversaciones</h3>
                <p className="text-xs text-white/40 leading-relaxed">Selecciona una conversación de la izquierda para ver los mensajes o negociar un bolo.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

