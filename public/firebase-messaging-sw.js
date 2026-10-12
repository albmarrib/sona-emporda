importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Escuchar evento Push (incluso con la app totalmente cerrada en segundo plano)
self.addEventListener('push', function(event) {
  let badgeNumber = 1;
  let title = 'Nuevo Mensaje en Sona Empordà';
  let body = 'Tienes un nuevo mensaje pendiente';
  let data = {};

  if (event.data) {
    try {
      const payload = event.data.json();
      data = payload.data || {};

      // 1. Extraer número de no leídos para el badge exterior del móvil
      if (data.unreadCount) {
        badgeNumber = parseInt(data.unreadCount, 10) || 1;
      } else if (payload.apns?.payload?.aps?.badge) {
        badgeNumber = parseInt(payload.apns.payload.aps.badge, 10) || 1;
      }

      // 2. Extraer textos si no vienen en notification nativa
      if (payload.notification) {
        title = payload.notification.title || title;
        body = payload.notification.body || body;
      } else if (data.title) {
        title = data.title;
        body = data.body || body;
      }
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  // 3. ACTUALIZAR EL BADGE / GLOBO EN EL ICONO DE LA PANTALLA DE INICIO (App Badging API)
  const setBadgePromise = (async () => {
    try {
      if ('setAppBadge' in navigator) {
        await navigator.setAppBadge(badgeNumber);
      } else if (self.registration && 'setAppBadge' in self.registration) {
        await self.registration.setAppBadge(badgeNumber);
      }
    } catch (err) {
      console.error('Error setting app badge in SW:', err);
    }
  })();

  // 4. MOSTRAR LA NOTIFICACIÓN VISUAL EN LA BANDEJA DEL SISTEMA
  const showNotificationPromise = (async () => {
    try {
      const options = {
        body: body,
        icon: '/pwa-icon.png',
        badge: '/pwa-icon.png',
        vibrate: [200, 100, 200],
        tag: 'sona-emporda-messages', // Agrupa notificaciones para no saturar
        renotify: true,
        data: data
      };
      await self.registration.showNotification(title, options);
    } catch (err) {
      console.error('Error showing notification in SW:', err);
    }
  })();

  event.waitUntil(Promise.all([setBadgePromise, showNotificationPromise]));
});

// Al pulsar sobre la notificación del sistema
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Limpiar el badge exterior si el usuario entra desde la notificación
  try {
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(console.error);
    } else if (self.registration && 'clearAppBadge' in self.registration) {
      self.registration.clearAppBadge().catch(console.error);
    }
  } catch (err) {
    console.error('Error clearing badge on click:', err);
  }

  const urlToOpen = new URL(event.notification.data?.url || '/musician/messages', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si la ventana ya existe, enfocarla
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrirla
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
