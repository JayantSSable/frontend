import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

// Use environment variable for WebSocket URL in production, fallback to localhost for development
let socketUrl = '';

if (process.env.REACT_APP_WEBSOCKET_URL) {
  // Remove any markdown formatting that might be in the environment variable
  socketUrl = process.env.REACT_APP_WEBSOCKET_URL.replace(/\[|\]\(.*?\)/g, '');
} else {
  socketUrl = 'http://localhost:8080/ws';
}

const SOCKET_URL = socketUrl;

console.log('Using WebSocket URL:', SOCKET_URL);

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.pendingSubscriptions = [];
    this.connectPromise = null;
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(onConnected, onError) {
    // If we're already connecting, return the existing promise
    if (this.connectPromise) {
      return this.connectPromise;
    }
    
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Create a new promise for the connection
    this.connectPromise = new Promise((resolve, reject) => {
      try {
        console.log('Attempting to connect to WebSocket...');
        const socket = new SockJS(SOCKET_URL);
        
        // Configure STOMP client
        this.stompClient = Stomp.over(socket);
        
        // Disable debug logging by providing an empty function
        this.stompClient.debug = () => {};
        
        // Connect to the WebSocket server
        this.stompClient.connect(
          {},
          () => {
            console.log('WebSocket connected successfully');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Process any pending subscriptions
            this.processPendingSubscriptions();
            
            if (onConnected) onConnected();
            resolve();
          },
          (error) => {
            console.error('WebSocket connection error:', error);
            this.isConnected = false;
            this.connectPromise = null;
            
            if (onError) onError(error);
            reject(error);
            
            // Try to reconnect with exponential backoff
            this.reconnectAttempts++;
            const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
            
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
            
            if (this.reconnectAttempts <= this.maxReconnectAttempts) {
              this.reconnectTimeout = setTimeout(() => {
                this.connect(onConnected, onError);
              }, delay);
            } else {
              console.error(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
            }
          }
        );
      } catch (e) {
        console.error('Error creating WebSocket connection:', e);
        this.connectPromise = null;
        reject(e);
      }
    });
    
    return this.connectPromise;
  }

  disconnect() {
    // Clear any reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Reset connection promise
    this.connectPromise = null;
    
    // Disconnect STOMP client if connected
    if (this.stompClient && this.isConnected) {
      try {
        this.stompClient.disconnect();
        console.log('WebSocket disconnected');
      } catch (e) {
        console.error('Error disconnecting WebSocket:', e);
      }
      
      this.isConnected = false;
      this.subscriptions.clear();
      this.pendingSubscriptions = [];
    }
  }

  subscribe(destination, callback) {
    // If already subscribed, return the existing subscription
    if (this.subscriptions.has(destination)) {
      return this.subscriptions.get(destination);
    }
    
    // If not connected, store as pending and connect
    if (!this.stompClient || !this.isConnected) {
      console.log(`WebSocket not connected, queuing subscription to ${destination}`);
      
      // Store the subscription request for later
      this.pendingSubscriptions.push({ destination, callback });
      
      // Attempt to connect
      this.connect();
      
      return null;
    }
    
    // Create the subscription
    try {
      console.log(`Subscribing to ${destination}`);
      const subscription = this.stompClient.subscribe(destination, (message) => {
        try {
          const payload = JSON.parse(message.body);
          callback(payload);
        } catch (e) {
          console.error(`Error processing message from ${destination}:`, e);
        }
      });
      
      // Store the subscription
      this.subscriptions.set(destination, subscription);
      return subscription;
    } catch (e) {
      console.error(`Error subscribing to ${destination}:`, e);
      return null;
    }
  }

  unsubscribe(destination) {
    if (this.subscriptions.has(destination)) {
      try {
        const subscription = this.subscriptions.get(destination);
        subscription.unsubscribe();
        console.log(`Unsubscribed from ${destination}`);
      } catch (e) {
        console.error(`Error unsubscribing from ${destination}:`, e);
      }
      
      this.subscriptions.delete(destination);
    }
    
    // Also remove from pending subscriptions if present
    this.pendingSubscriptions = this.pendingSubscriptions.filter(
      sub => sub.destination !== destination
    );
  }

  subscribeToQueue(queueId, callback) {
    return this.subscribe(`/topic/queue/${queueId}`, callback);
  }

  subscribeToPatient(patientId, callback) {
    return this.subscribe(`/topic/patient/${patientId}`, callback);
  }
  
  processPendingSubscriptions() {
    if (!this.isConnected || this.pendingSubscriptions.length === 0) {
      return;
    }
    
    console.log(`Processing ${this.pendingSubscriptions.length} pending subscriptions`);
    
    // Process all pending subscriptions
    const pending = [...this.pendingSubscriptions];
    this.pendingSubscriptions = [];
    
    pending.forEach(({ destination, callback }) => {
      this.subscribe(destination, callback);
    });
  }
}

export default new WebSocketService();
