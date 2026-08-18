importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Necesitamos las mismas credenciales que en firebase.ts (las públicas)
const firebaseConfig = {
  // Estas son genéricas, reemplazarlas si tu entorno cambia
  apiKey: "YOUR_API_KEY", // Will be replaced below or ignored if it picks up from environment, but usually SW needs hardcoded or fetched config
};

// Como Vite inyecta variables de entorno, no podemos usar import.meta.env aquí.
// Usaremos la API URL search params o inyectaremos esto en tiempo de build, 
// pero para simplificar, FCM v9+ permite registrarlo de forma sencilla,
// O simplemente no inicializamos Firebase app aquí, FCM background lo hace si 
// recibe el payload correctamente formado de Cloud Functions con 'notification'.
// Si pasas 'notification' en el payload de Cloud Functions, el navegador muestra 
// la notificación automáticamente sin necesidad de código en este Service Worker.

self.addEventListener('push', function(event) {
  // En caso de que FCM no maneje automáticamente la notificación (e.g. data only message)
  if (event.data) {
    const payload = event.data.json();
    
    // Intenta usar la PWA Badging API si el OS no lo hace automáticamente
    if (navigator.setAppBadge && payload.apns && payload.apns.payload && payload.apns.payload.aps) {
       const badgeCount = payload.apns.payload.aps.badge;
       if (badgeCount > 0) {
         navigator.setAppBadge(badgeCount).catch(console.error);
       }
    }
    // Also try to read it from webpush headers or data if sent customly
    else if (navigator.setAppBadge && payload.data && payload.data.unreadCount) {
       navigator.setAppBadge(parseInt(payload.data.unreadCount, 10)).catch(console.error);
    }

    if (!payload.notification) {
      const title = payload.data?.title || 'Nuevo Mensaje';
      const options = {
        body: payload.data?.body || 'Tienes un nuevo mensaje en Sona Empordà',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: payload.data
      };
      event.waitUntil(self.registration.showNotification(title, options));
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data?.url || '/musician/messages', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
