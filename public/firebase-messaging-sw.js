// Firebase Service Worker for background notifications
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Service worker initialization
console.log('[Firebase SW] Service worker initializing...');

// Log service worker scope and registration
self.addEventListener('install', event => {
  console.log('[Firebase SW] Service worker installed');
});

self.addEventListener('activate', event => {
  console.log('[Firebase SW] Service worker activated');
  event.waitUntil(self.clients.claim());
});

// Firebase configuration with placeholders that will be replaced at build time
const firebaseConfig = {
  apiKey: "AIzaSyDN_qfUw9rHwU0QnRd5Ylnmj-XH7Hj5tHY",
  authDomain: "queue-ms-65087.firebaseapp.com",
  projectId: "queue-ms-65087",
  storageBucket: "queue-ms-65087.firebasestorage.app",
  messagingSenderId: "200266349460",
  appId: "1:200266349460:web:5587f85f2de389b12a6d81"
};

console.log('[Firebase SW] Configuration loaded:', firebaseConfig);

// Initialize Firebase and set up messaging
let messaging;
try {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  console.log('[Firebase SW] Firebase initialized successfully');
  
  // Get messaging instance
  messaging = firebase.messaging();
  console.log('[Firebase SW] Messaging instance created');
  
  // Set up background message handler
  messaging.onBackgroundMessage(function(payload) {
    console.log('[Firebase SW] Received background message:', payload);
    
    // Extract notification data
    const notificationTitle = payload.notification?.title || 'Queue Update';
    const notificationOptions = {
      body: payload.notification?.body || 'Your queue status has been updated',
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: payload.data,
      tag: 'queue-notification', // Group similar notifications
      requireInteraction: true,  // Notification persists until user interacts with it
      actions: [
        {
          action: 'view',
          title: 'View Status'
        }
      ]
    };
    
    console.log('[Firebase SW] Showing notification with title:', notificationTitle);
    console.log('[Firebase SW] Notification options:', notificationOptions);
    
    // Show notification
    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.error('[Firebase SW] Firebase initialization error:', error);
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();
  
  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const patientId = event.notification.data?.patientId;
        const url = patientId ? `/patient-status/${patientId}` : '/';
        
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
