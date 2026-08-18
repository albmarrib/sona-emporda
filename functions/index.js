const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendChatNotification = onDocumentCreated("chats/{chatId}/messages/{messageId}", async (event) => {
  const messageData = event.data.data();
  if (!messageData) return;

  const { senderId, text } = messageData;
  const chatId = event.params.chatId;

  // Get chat details
  const chatDoc = await admin.firestore().collection("chats").doc(chatId).get();
  if (!chatDoc.exists) return;

  const chatData = chatDoc.data();
  const participants = chatData.participants || [];

  // Find recipient
  const recipientId = participants.find(id => id !== senderId);
  if (!recipientId) return;

  // Get sender profile for name
  const senderDoc = await admin.firestore().collection("users").doc(senderId).get();
  const senderName = senderDoc.exists ? (senderDoc.data().stageName || senderDoc.data().name || "Alguien") : "Alguien";

  // Get recipient FCM tokens
  const recipientDoc = await admin.firestore().collection("users").doc(recipientId).get();
  if (!recipientDoc.exists) return;

  const recipientData = recipientDoc.data();
  const fcmTokens = recipientData.fcmTokens || [];
  const role = recipientData.role || 'musician';
  const baseUrl = role === 'venue' ? '/venue/messages' : '/musician/messages';

  if (fcmTokens.length === 0) {
    console.log(`No FCM tokens for user ${recipientId}`);
    return;
  }

  // Calculate total unread messages for the recipient
  let unreadCount = 0;
  try {
    const chatsSnapshot = await admin.firestore().collection("chats").where("participants", "array-contains", recipientId).get();
    for (const chat of chatsSnapshot.docs) {
      const messagesSnapshot = await admin.firestore().collection(`chats/${chat.id}/messages`).where("read", "==", false).get();
      messagesSnapshot.forEach(msg => {
        if (msg.data().senderId !== recipientId) {
          unreadCount++;
        }
      });
    }
  } catch (err) {
    console.error("Error calculating unread count:", err);
    unreadCount = 1; // Fallback
  }

  // Construct message with APNs payload for iOS Badging
  const payload = {
    notification: {
      title: `Nuevo mensaje de ${senderName}`,
      body: text.length > 50 ? text.substring(0, 50) + "..." : text,
    },
    apns: {
      payload: {
        aps: {
          badge: unreadCount,
          sound: "default"
        }
      }
    },
    webpush: {
      headers: {
        Urgency: "high"
      },
      notification: {
        badge: "https://sona-emporda.web.app/pwa-icon.png",
        icon: "https://sona-emporda.web.app/pwa-icon.png",
      }
    },
    data: {
      url: `${baseUrl}?chatId=${chatId}`,
      chatId: chatId,
      unreadCount: unreadCount.toString(),
    },
    tokens: fcmTokens
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(payload);
    console.log(`Successfully sent ${response.successCount} messages. Failed: ${response.failureCount}`);
    
    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (errCode === 'messaging/invalid-registration-token' || errCode === 'messaging/registration-token-not-registered') {
            failedTokens.push(fcmTokens[idx]);
          }
        }
      });

      if (failedTokens.length > 0) {
        await admin.firestore().collection("users").doc(recipientId).update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
        });
        console.log(`Removed ${failedTokens.length} invalid tokens.`);
      }
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
});
