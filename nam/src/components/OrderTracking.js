import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClockIcon, 
  CogIcon, 
  TruckIcon, 
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const OrderTracking = ({ order, className = '' }) => {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [socket, setSocket] = useState(null);
  const { API_BASE_URL } = useAuth();

  // Status configuration
  const statusConfig = {
    pending: {
      icon: ClockIcon,
      color: 'text-warning-500',
      bgColor: 'bg-warning-100',
      title: 'Order Pending',
      description: 'Your order has been received and is being reviewed.'
    },
    processing: {
      icon: CogIcon,
      color: 'text-primary-500',
      bgColor: 'bg-primary-100',
      title: 'Processing',
      description: 'Your order is being prepared for shipment.'
    },
    shipped: {
      icon: TruckIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      title: 'Shipped',
      description: 'Your order is on its way to you.'
    },
    delivered: {
      icon: CheckCircleIcon,
      color: 'text-success-500',
      bgColor: 'bg-success-100',
      title: 'Delivered',
      description: 'Your order has been successfully delivered.'
    },
    cancelled: {
      icon: XCircleIcon,
      color: 'text-error-500',
      bgColor: 'bg-error-100',
      title: 'Cancelled',
      description: 'Your order has been cancelled.'
    }
  };

  const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];

  // Set up socket connection for real-time updates
  useEffect(() => {
    if (!currentOrder?._id) return;

    const socketUrl = API_BASE_URL.replace('/api', '');
    const newSocket = io(socketUrl);

    newSocket.on('connect', () => {
      console.log('Connected to order tracking socket');
      newSocket.emit('join-order-room', currentOrder._id);
    });

    newSocket.on('orderUpdate', (updateData) => {
      console.log('Received order update:', updateData);
      if (updateData.orderId === currentOrder._id) {
        setCurrentOrder(prev => ({
          ...prev,
          status: updateData.status,
          updatedAt: updateData.updatedAt
        }));
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from order tracking socket');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('leave-order-room', currentOrder._id);
        newSocket.disconnect();
      }
    };
  }, [currentOrder?._id, API_BASE_URL]);

  // Update local state when order prop changes
  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  if (!currentOrder) {
    return (
      <div className={`card p-6 ${className}`}>
        <p className="text-gray-500 text-center">No order data available</p>
      </div>
    );
  }

  const currentStatus = currentOrder.status;
  const currentStatusIndex = statusOrder.indexOf(currentStatus);
  const config = statusConfig[currentStatus];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFishType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className={`card p-6 ${className}`}>
      {/* Order Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Order #{currentOrder.orderNumber}
          </h3>
          <p className="text-sm text-gray-500">
            Placed on {formatDate(currentOrder.createdAt)}
          </p>
        </div>
        <motion.div
          className={`flex items-center space-x-2 px-3 py-1 rounded-full ${config.bgColor}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <config.icon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-sm font-medium ${config.color}`}>
            {config.title}
          </span>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {statusOrder.map((status, index) => {
            const isActive = index <= currentStatusIndex;
            const isCurrent = status === currentStatus;
            const statusConf = statusConfig[status];

            return (
              <div key={status} className="flex flex-col items-center flex-1">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isActive
                      ? `${statusConf.bgColor} ${statusConf.color} border-current`
                      : 'bg-gray-100 text-gray-400 border-gray-300'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <statusConf.icon className="w-5 h-5" />
                </motion.div>
                <span className={`text-xs mt-2 text-center ${
                  isActive ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}>
                  {statusConf.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress Line */}
        <div className="relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 rounded-full" />
          <motion.div
            className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
            initial={{ width: '0%' }}
            animate={{ 
              width: currentStatus === 'cancelled' 
                ? '0%' 
                : `${(currentStatusIndex / (statusOrder.length - 1)) * 100}%` 
            }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Current Status Description */}
      <motion.div
        className="bg-gray-50 rounded-lg p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={currentStatus} // Re-animate when status changes
      >
        <div className="flex items-start space-x-3">
          <config.icon className={`w-5 h-5 ${config.color} mt-0.5`} />
          <div>
            <h4 className="font-medium text-gray-900">{config.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{config.description}</p>
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {formatDate(currentOrder.updatedAt)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Order Items */}
      <div className="space-y-3 mb-6">
        <h4 className="font-medium text-gray-900">Order Items</h4>
        {currentOrder.items?.map((item, index) => (
          <motion.div
            key={index}
            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                <span className="text-sm">🐟</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {formatFishType(item.fishType)} (Size {item.fishSize})
                </p>
                <p className="text-sm text-gray-500">
                  {item.quantity}kg × KSh {item.pricePerKg.toLocaleString()}
                </p>
              </div>
            </div>
            <span className="font-medium text-gray-900">
              KSh {item.subtotal.toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">KSh {currentOrder.totalPrice?.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Delivery Fee</span>
          <span className="font-medium">KSh {currentOrder.deliveryFee?.toLocaleString() || '100'}</span>
        </div>
        <div className="flex items-center justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
          <span>Total</span>
          <span className="text-primary-600">
            KSh {((currentOrder.totalPrice || 0) + (currentOrder.deliveryFee || 100)).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Delivery Information */}
      {currentOrder.deliveryAddress && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
          <p className="text-sm text-gray-600">{currentOrder.deliveryAddress}</p>
          {currentOrder.estimatedDelivery && (
            <p className="text-sm text-gray-500 mt-2">
              Estimated delivery: {formatDate(currentOrder.estimatedDelivery)}
            </p>
          )}
        </div>
      )}

      {/* Real-time Connection Status */}
      <div className="mt-4 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-success-500 animate-pulse' : 'bg-gray-400'}`} />
          <span>{socket?.connected ? 'Live updates enabled' : 'Connecting...'}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;