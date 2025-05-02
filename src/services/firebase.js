import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * Request permission for notifications and get FCM token
 * @returns {Promise<string|null>} FCM token if permission granted, null otherwise
 */
export const requestNotificationPermission = async () => {
  try {
    console.log('Request notification permission and get FCM token');
    
    // Check if notification permission is already granted
    const permission = await Notification.requestPermission();
    console.log('Permission result:', permission);
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      // Get messaging instance
      const messaging = getMessaging(app);
      
      // Register the service worker directly
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service worker registered:', registration);
        
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('Service worker is ready');
        
        // Try to get the FCM token with the properly formatted VAPID key
        try {
          console.log('Getting FCM token...');
          
          // Use the VAPID key directly from Firebase Console (it already has the correct format)
          const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
          console.log('Using VAPID key from Firebase Console:', vapidKey.substring(0, 10) + '...');
          
          const currentToken = await getToken(messaging, {
            vapidKey: vapidKey,
            serviceWorkerRegistration: registration
          });
          
          if (currentToken) {
            console.log('FCM token obtained:', currentToken);
            return currentToken;
          } else {
            console.error('No registration token available');
            return null;
          }
        } catch (tokenError) {
          console.error('Error getting FCM token:', tokenError);
          return null;
        }
      } catch (regError) {
        console.error('Error registering service worker:', regError);
        return null;
      }
    } else {
      console.warn('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error in notification permission flow:', error);
    return null;
  }
};

// Note: Device token registration has been moved to api.js

/**
 * Listen for foreground messages
 * @param {Function} callback - Function to call when message is received
 * @returns {Function} Unsubscribe function
 */
export const onMessageListener = (callback) => {
  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
  
  return unsubscribe;
};

export default { requestNotificationPermission, onMessageListener };
