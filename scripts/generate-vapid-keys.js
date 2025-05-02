/**
 * Script to generate VAPID keys for Firebase Cloud Messaging
 * Run with: node scripts/generate-vapid-keys.js
 */
const webpush = require('web-push');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Keys generated:');
console.log('===========================================');
console.log('Public Key (for frontend):');
console.log(vapidKeys.publicKey);
console.log('===========================================');
console.log('Private Key (for backend):');
console.log(vapidKeys.privateKey);
console.log('===========================================');
console.log('Add these to your .env files:');
console.log(`REACT_APP_FIREBASE_VAPID_KEY=${vapidKeys.publicKey}`);
console.log('===========================================');
