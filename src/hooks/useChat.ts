import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { ChatRoom } from '../types/chat';
import { getSafeTimeMs } from '../utils/dateUtils';

export const useChat = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByChat, setUnreadByChat] = useState<Record<string, number>>({});

  // Subscribe to user's chats
  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let updatedAt = data.updatedAt;
        if (typeof updatedAt?.toDate === 'function') {
          updatedAt = updatedAt.toDate().toISOString();
        } else if (updatedAt?.seconds !== undefined) {
          updatedAt = new Date(updatedAt.seconds * 1000).toISOString();
        }
        return {
          id: docSnap.id,
          ...data,
          participants: Array.isArray(data.participants) ? data.participants : [],
          updatedAt: updatedAt || new Date().toISOString()
        };
      }) as ChatRoom[];
      
      // Sort by updatedAt descending locally and safely
      chatsData.sort((a, b) => getSafeTimeMs(b.updatedAt) - getSafeTimeMs(a.updatedAt));
      
      setChats(chatsData);
      setLoading(false);
    }, (error) => {
      console.error("Error subscribing to chats:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Global unread count calculation
  useEffect(() => {
    if (!currentUser || chats.length === 0) {
      setUnreadCount(0);
      setUnreadByChat({});
      return;
    }

    const unreadMap = new Map<string, number>();

    const unsubscribes = chats.map(chat => {
      const messagesRef = collection(db, `chats/${chat.id}/messages`);
      const q = query(
        messagesRef,
        where('read', '==', false)
      );

      return onSnapshot(q, (snapshot) => {
        // Only count messages where we are not the sender
        const unreadForChat = snapshot.docs.filter(d => d.data().senderId !== currentUser.uid).length;
        unreadMap.set(chat.id, unreadForChat);
        
        let total = 0;
        const newUnreadByChat: Record<string, number> = {};
        unreadMap.forEach((count, key) => {
          total += count;
          newUnreadByChat[key] = count;
        });
        setUnreadByChat(newUnreadByChat);
        setUnreadCount(total);

        // Actualizar el icono de la app (PWA Badging API)
        if ('setAppBadge' in navigator) {
          try {
            if (total > 0) {
              navigator.setAppBadge(total).catch(() => {});
            } else {
              navigator.clearAppBadge().catch(() => {});
            }
          } catch {}
        }
      }, (err) => {
        console.warn(`Unread onSnapshot warning for chat ${chat.id}:`, err);
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [chats, currentUser]);

  const findOrCreateChat = async (otherUserId: string, eventId?: string): Promise<string> => {
    if (!currentUser) throw new Error('No user logged in');
    if (!otherUserId || otherUserId === 'venue') throw new Error('Invalid otherUserId provided to findOrCreateChat');

    // Check if chat exists with these exact two participants (and optionally eventId)
    // Note: A more robust query would ensure exact match, but this works for 2 participants
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    
    let existingChatId = null;
    querySnapshot.forEach((doc) => {
      const data = doc.data() as ChatRoom;
      if (data.participants.includes(otherUserId)) {
        existingChatId = doc.id;
      }
    });

    if (existingChatId) {
      if (eventId) {
        // Update the chat's context to the most recent event they are discussing
        await updateDoc(doc(db, 'chats', existingChatId), { eventId });
      }
      return existingChatId;
    }

    // Create new chat
    const newChatRef = await addDoc(collection(db, 'chats'), {
      participants: [currentUser.uid, otherUserId],
      eventId: eventId || null,
      updatedAt: new Date().toISOString(),
      lastMessage: ''
    });

    return newChatRef.id;
  };

  const deleteChat = async (chatId: string) => {
    if (!currentUser) return;
    try {
      const chatDoc = await getDocs(query(collection(db, 'chats'), where('__name__', '==', chatId)));
      if (!chatDoc.empty) {
        const data = chatDoc.docs[0].data() as ChatRoom;
        const newParticipants = data.participants.filter(id => id !== currentUser.uid);
        
        await updateDoc(doc(db, 'chats', chatId), {
          participants: newParticipants
        });
      }
    } catch (e) {
      console.error("Error al eliminar el chat", e);
    }
  };

  const setTypingStatus = async (chatId: string, isTyping: boolean) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        [`typing.${currentUser.uid}`]: isTyping
      });
    } catch (e) {
      console.error("Error updating typing status:", e);
    }
  };

  const sendMessage = async (chatId: string, text: string) => {
    if (!currentUser) return;

    const now = new Date().toISOString();

    // Add message
    await addDoc(collection(db, `chats/${chatId}/messages`), {
      senderId: currentUser.uid,
      text,
      createdAt: now,
      read: false
    });

    // Update chat room lastMessage and updatedAt
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: text,
      updatedAt: now
    });
  };

  return {
    chats,
    loading,
    unreadCount,
    unreadByChat,
    findOrCreateChat,
    sendMessage,
    deleteChat,
    setTypingStatus
  };
};
