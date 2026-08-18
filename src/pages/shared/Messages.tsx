import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { ChatList } from '../../components/chat/ChatList';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { allMockMusicians } from '../../data/mockMusicianData';
import type { ChatRoom } from '../../types/chat';

export const Messages = () => {
  const { chats, unreadByChat, deleteChat } = useChat();
  const { currentUser } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlChatId = searchParams.get('chatId');
  const [activeChatId, setActiveChatId] = useState<string | null>(location.state?.chatId || urlChatId || null);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  
  // Set initial active chat if navigated from somewhere
  useEffect(() => {
    if (!activeChatId && chats.length > 0 && window.innerWidth >= 768) {
      // Auto-select first on desktop
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  // Fetch participant names
  useEffect(() => {
    if (!currentUser) return;

    const fetchNames = async () => {
      const names: Record<string, string> = { ...participantNames };
      let updated = false;

      for (const chat of chats) {
        const otherId = chat.participants.find(id => id !== currentUser.uid);
        if (otherId && !names[otherId]) {
          // Try mock musicians first
          const mock = allMockMusicians.find(m => m.id === otherId);
          if (mock) {
            names[otherId] = mock.stageName;
            updated = true;
          } else {
            // Try firestore
            const docRef = doc(db, 'users', otherId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              names[otherId] = data.stageName || data.name || 'Usuario';
              updated = true;
            } else {
              names[otherId] = 'Usuario Desconocido';
              updated = true;
            }
          }
        }
      }

      if (updated) {
        setParticipantNames(names);
      }
    };

    fetchNames();
  }, [chats, currentUser, participantNames]);

  const getOtherParticipantName = (chat: ChatRoom) => {
    if (!currentUser) return 'Desconocido';
    const otherId = chat.participants.find(id => id !== currentUser.uid);
    return otherId ? (participantNames[otherId] || 'Cargando...') : 'Desconocido';
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="flex h-full -mx-4 sm:-mx-6 md:-mx-12 -my-4 sm:-my-6 md:-my-12">
      {/* Mobile view logic: if chat is active, show only window, else list */}
      <div className={`w-full md:w-80 lg:w-96 shrink-0 ${activeChatId ? 'hidden md:block' : 'block'}`}>
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

      <div className={`flex-1 min-w-0 ${!activeChatId ? 'hidden md:block' : 'block'}`}>
        {activeChat ? (
          <ChatWindow 
            chat={activeChat} 
            onBack={() => setActiveChatId(null)} 
            getOtherParticipantName={getOtherParticipantName}
          />
        ) : (
          <div className="hidden md:flex h-full items-center justify-center bg-black">
            <div className="text-center text-white/30">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p>Selecciona una conversación para empezar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
