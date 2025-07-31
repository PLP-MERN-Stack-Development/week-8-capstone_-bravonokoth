import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCartIcon, 
  XMarkIcon, 
  MinusIcon, 
  PlusIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';

const Cart = ({ isOpen, onClose, items = [], onUpdateQuantity, onRemoveItem, onCheckout }) => {
  const [localItems, setLocalItems] = useState([]);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const calculateSubtotal = (item) => {
    return item.quantity * item.pricePerKg;
  };

  const calculateTotal = () => {
    return localItems.reduce((total, item) => total + calculateSubtotal(item), 0);
  };

  const deliveryFee = 100; // KSh 100 delivery fee
  const grandTotal = calculateTotal() + deliveryFee;

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    const updatedItems = localItems.map(item => 
      item._id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setLocalItems(updatedItems);
    
    if (onUpdateQuantity) {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId) => {
    const updatedItems = localItems.filter(item => item._id !== itemId);
    setLocalItems(updatedItems);
    
    if (onRemoveItem) {
      onRemoveItem(itemId);
    }
  };

  const formatFishType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Cart Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-hard z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <ShoppingCartIcon className="w-6 h-6 text-primary-600" />
                </motion.div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Your Cart
                  {localItems.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({localItems.length} item{localItems.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </h2>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {localItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    🛒
                  </motion.div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 mb-6">Add some fresh fish to get started!</p>
                  <motion.button
                    onClick={onClose}
                    className="btn btn-primary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Continue Shopping
                  </motion.button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {localItems.map((item, index) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-start space-x-4">
                          {/* Fish Image/Icon */}
                          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">🐟</span>
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {formatFishType(item.type)}
                            </h4>
                            <p className="text-sm text-gray-500">Size {item.size}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm font-medium text-primary-600">
                                KSh {item.pricePerKg.toLocaleString()}/kg
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                KSh {calculateSubtotal(item).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <motion.button
                            onClick={() => handleRemoveItem(item._id)}
                            className="p-1 text-gray-400 hover:text-error-500 transition-colors duration-200"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </motion.button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-sm text-gray-600">Quantity</span>
                          <div className="flex items-center space-x-3">
                            <motion.button
                              onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors duration-200"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <MinusIcon className="w-4 h-4 text-gray-600" />
                            </motion.button>
                            <span className="text-lg font-medium text-gray-900 min-w-[3rem] text-center">
                              {item.quantity}kg
                            </span>
                            <motion.button
                              onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center transition-colors duration-200"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <PlusIcon className="w-4 h-4 text-white" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer with Totals and Checkout */}
            {localItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-gray-200 p-6 bg-gray-50"
              >
                {/* Order Summary */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">KSh {calculateTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">KSh {deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-primary-600">
                        KSh {grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <motion.button
                  onClick={() => {
                    if (onCheckout) {
                      onCheckout(localItems, grandTotal);
                    }
                  }}
                  className="w-full btn btn-primary btn-lg relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative z-10">Proceed to Checkout</span>
                </motion.button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  Free delivery on orders above KSh 2,000
                </p>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Cart;