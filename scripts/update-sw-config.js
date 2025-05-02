const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Path to the service worker file
const swPath = path.join(__dirname, '../public/firebase-messaging-sw.js');

// Read the service worker file
let swContent = fs.readFileSync(swPath, 'utf8');

// Replace placeholders with actual environment variables
swContent = swContent.replace('__FIREBASE_API_KEY__', process.env.REACT_APP_FIREBASE_API_KEY);
swContent = swContent.replace('__FIREBASE_AUTH_DOMAIN__', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN);
swContent = swContent.replace('__FIREBASE_PROJECT_ID__', process.env.REACT_APP_FIREBASE_PROJECT_ID);
swContent = swContent.replace('__FIREBASE_STORAGE_BUCKET__', process.env.REACT_APP_FIREBASE_STORAGE_BUCKET);
swContent = swContent.replace('__FIREBASE_MESSAGING_SENDER_ID__', process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID);
swContent = swContent.replace('__FIREBASE_APP_ID__', process.env.REACT_APP_FIREBASE_APP_ID);

// Write the updated content back to the service worker file
fs.writeFileSync(swPath, swContent);

console.log('Firebase service worker configuration updated with environment variables');
