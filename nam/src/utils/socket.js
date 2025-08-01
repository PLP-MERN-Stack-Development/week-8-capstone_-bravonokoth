import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  connect(serverUrl = null) {
    const socketUrl = serverUrl || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const token = localStorage.getItem('fishDeliveryToken');

    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      auth: { token },
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('socketConnected', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      this.isConnected = false;
      this.emit('socketDisconnected', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error.message);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.emit('socketError', { error: 'Max reconnection attempts reached' });
        this.disconnect();
      }
      if (error.message.includes('Authentication error')) {
        localStorage.removeItem('fishDeliveryToken');
        window.location.href = '/login';
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error.message);
      this.emit('socketError', error);
    });

    this.socket.on('orderUpdate', (data) => {
      console.log('Order update received:', data);
      this.emit('orderUpdate', data);
    });

    this.socket.on('newOrder', (data) => {
      console.log('New order notification received:', data);
      this.emit('newOrder', data);
    });
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((callback) => callback(data));
  }

  on(event, callback) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event) || [];
    this.listeners.set(event, callbacks.filter((cb) => cb !== callback));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinOrderRoom(orderId) {
    if (this.socket) {
      this.socket.emit('join-order-room', orderId);
    }
  }

  joinAdminRoom() {
    if (this.socket) {
      this.socket.emit('join-admin-room');
    }
  }
}

const socketManager = new SocketManager();
export default socketManager;