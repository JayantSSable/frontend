import SockJS from 'sockjs-client';
import { Stomp, Client } from '@stomp/stompjs';

// Determine the backend URL based on the current environment
const getBackendUrl = () => {
  // Use environment variable if available
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL.replace(/\[|\]\(.*?\)/g, '');
  }
  
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8080';
  }
  
  // In production, use the explicit backend URL for Render.com
  return 'https://hospital-queue-backend.onrender.com';
};

// Construct the complete WebSocket endpoint URL
const SOCKET_URL = `${getBackendUrl()}/ws`;

// Always enable WebSockets in all environments
const WEBSOCKET_ENABLED = true;

console.log('Using WebSocket URL:', SOCKET_URL);
console.log('WebSocket enabled:', WEBSOCKET_ENABLED);
console.log('Environment:', process.env.NODE_ENV);

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
    // If WebSockets are disabled, immediately resolve with a dummy connection
    if (!WEBSOCKET_ENABLED) {
      console.log('WebSockets are disabled. Using fallback mode.');
      this.isConnected = false;
      this.connectPromise = Promise.resolve();
      if (onConnected) setTimeout(onConnected, 0);
      return this.connectPromise;
    }
    
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
        console.log('Attempting to connect to WebSocket at:', SOCKET_URL);
        
        // Create a StompJS Client with proper configuration for auto-reconnect
        try {
          // Create a factory function for SockJS
          const socketFactory = () => {
            return new SockJS(SOCKET_URL);
          };
          
          // Create a new StompJS client
          this.stompClient = new Client({
            // Use the factory function for SockJS
            webSocketFactory: socketFactory,
            
            // Configure reconnect parameters
            reconnectDelay: 5000,         // Wait 5 seconds before attempting reconnect
            heartbeatIncoming: 4000,      // Expect server heartbeat every 4 seconds
            heartbeatOutgoing: 4000,      // Send heartbeat every 4 seconds
            
            // Disable debug logs
            debug: () => {},
            
            // Configure connection timeout
            connectionTimeout: 10000,     // 10 second timeout
            
            // Callbacks
            onConnect: () => {
              console.log('WebSocket connected successfully');
              this.isConnected = true;
              this.reconnectAttempts = 0;
              
              // Process any pending subscriptions
              this.processPendingSubscriptions();
              
              if (onConnected) onConnected();
              resolve();
            },
            
            onStompError: (frame) => {
              console.error('STOMP protocol error:', frame);
              this.isConnected = false;
              if (onError) onError(new Error(`STOMP error: ${frame.headers.message}`));
            },
            
            onWebSocketClose: (closeEvent) => {
              if (!this.isConnected) return; // Ignore if we weren't connected
              
              console.warn(`WebSocket closed with code: ${closeEvent.code}, reason: ${closeEvent.reason || 'No reason provided'}`);
              this.isConnected = false;
              
              // Client will auto-reconnect thanks to the StompJS Client configuration
            },
            
            onWebSocketError: (error) => {
              console.error('WebSocket error:', error);
            },
            
            onDisconnect: () => {
              console.log('STOMP client disconnected');
              this.isConnected = false;
            }
          });
          
          // Activate the client (starts the connection process)
          this.stompClient.activate();
          
          // Set a timeout for the initial connection
          const connectionTimeout = setTimeout(() => {
            if (!this.isConnected) {
              console.error('WebSocket connection timeout after 10 seconds');
              this.connectPromise = null;
              reject(new Error('Connection timeout'));
              this._scheduleReconnect(onConnected, onError);
            }
          }, 10000); // 10 second timeout
          
        } catch (error) {
          console.error('Error initializing STOMP client:', error);
          this.isConnected = false;
          this.connectPromise = null;
          reject(error);
          this._scheduleReconnect(onConnected, onError);
        }
      } catch (e) {
        console.error('Error creating WebSocket connection:', e);
        this.connectPromise = null;
        reject(e);
      }
    });
    
    return this.connectPromise;
  }
  
  // Helper method to schedule reconnection attempts
  _scheduleReconnect(onConnected, onError) {
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

  disconnect() {
    // Clear any reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Reset connection promise
    this.connectPromise = null;
    
    // Disconnect STOMP client if it exists
    if (this.stompClient) {
      try {
        // For the new StompJS Client, we use deactivate() instead of disconnect()
        if (this.stompClient.deactivate) {
          this.stompClient.deactivate();
        } else if (this.stompClient.disconnect) {
          // Fallback for older implementations
          this.stompClient.disconnect();
        }
        console.log('WebSocket disconnected');
      } catch (e) {
        console.error('Error disconnecting WebSocket:', e);
      }
    }
    
    // Reset state
    this.isConnected = false;
    this.subscriptions.clear();
    this.pendingSubscriptions = [];
  }

  subscribe(destination, callback) {
    // If WebSockets are disabled, create a dummy subscription
    if (!WEBSOCKET_ENABLED) {
      console.log(`WebSockets disabled, creating dummy subscription for ${destination}`);
      // Create a dummy subscription object that does nothing
      const dummySubscription = {
        id: `dummy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        unsubscribe: () => {}
      };
      
      // Store it so we don't try to subscribe again
      this.subscriptions.set(destination, dummySubscription);
      return dummySubscription;
    }
    
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
          // Try to parse as JSON first
          try {
            const payload = JSON.parse(message.body);
            callback(payload);
          } catch (jsonError) {
            // If not valid JSON, pass the raw message body as a string
            console.log(`Message is not JSON: ${message.body}`);
            callback(message.body);
          }
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
