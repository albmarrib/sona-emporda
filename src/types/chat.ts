export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[]; // [venueId, musicianId]
  eventId?: string; // Optional context
  lastMessage?: string;
  updatedAt: string;
  typing?: Record<string, boolean>;
}
