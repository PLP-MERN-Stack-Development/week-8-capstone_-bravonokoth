import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

const Toast = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose, 
  position = 'top-right',
  showCloseButton = true 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Wait for exit animation
  };

  const toastConfig = {
    success: {
      icon: CheckCircleIcon,
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      iconColor: 'text-success-500',
      textColor: 'text-success-800',
      progressColor: 'bg-success-500'
    },
    error: {
      icon: XCircleIcon,
      bgColor: 'bg-error-50',
      borderColor: 'border-error-200',
      iconColor: 'text-error-500',
      textColor: 'text-error-800',
      progressColor: 'bg-error-500'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      iconColor: 'text-warning-500',
      textColor: 'text-warning-800',
      progressColor: 'bg-warning-500'
    },
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-800',
      progressColor: 'bg-blue-500'
    }
  };

  const config = toastConfig[type] || toastConfig.info;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  const slideVariants = {
    'top-right': {
      initial: { x: 400, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 400, opacity: 0 }
    },
    'top-left': {
      initial: { x: -400, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -400, opacity: 0 }
    },
    'top-center': {
      initial: { y: -100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -100, opacity: 0 }
    },
    'bottom-right': {
      initial: { x: 400, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 400, opacity: 0 }
    },
    'bottom-left': {
      initial: { x: -400, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -400, opacity: 0 }
    },
    'bottom-center': {
      initial: { y: 100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 100, opacity: 0 }
    }
  };

  const variants = slideVariants[position] || slideVariants['top-right'];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed z-50 ${positionClasses[position]} max-w-sm w-full`}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={{ 
            type: 'spring', 
            stiffness: 500, 
            damping: 30 
          }}
        >
          <div className={`
            ${config.bgColor} 
            ${config.borderColor} 
            border 
            rounded-lg 
            shadow-lg 
            backdrop-blur-sm 
            overflow-hidden
            relative
          `}>
            {/* Progress bar */}
            {duration > 0 && (
              <motion.div
                className={`absolute top-0 left-0 h-1 ${config.progressColor}`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            )}

            <div className="p-4">
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 500, 
                    damping: 30,
                    delay: 0.1 
                  }}
                >
                  <config.icon className={`w-6 h-6 ${config.iconColor} flex-shrink-0`} />
                </motion.div>

                {/* Message */}
                <motion.div
                  className="flex-1 min-w-0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className={`text-sm font-medium ${config.textColor}`}>
                    {message}
                  </p>
                </motion.div>

                {/* Close button */}
                {showCloseButton && (
                  <motion.button
                    onClick={handleClose}
                    className={`flex-shrink-0 p-1 rounded-md ${config.textColor} hover:bg-black/5 transition-colors duration-200`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Toast Container Component for managing multiple toasts
export const ToastContainer = ({ toasts = [], removeToast, position = 'top-right' }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              ...getToastPosition(position, index)
            }}
            className="pointer-events-auto"
          >
            <Toast
              {...toast}
              position={position}
              onClose={() => removeToast(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Helper function to calculate toast positions
const getToastPosition = (position, index) => {
  const offset = index * 80; // 80px spacing between toasts

  switch (position) {
    case 'top-right':
      return { top: 16 + offset, right: 16 };
    case 'top-left':
      return { top: 16 + offset, left: 16 };
    case 'top-center':
      return { top: 16 + offset, left: '50%', transform: 'translateX(-50%)' };
    case 'bottom-right':
      return { bottom: 16 + offset, right: 16 };
    case 'bottom-left':
      return { bottom: 16 + offset, left: 16 };
    case 'bottom-center':
      return { bottom: 16 + offset, left: '50%', transform: 'translateX(-50%)' };
    default:
      return { top: 16 + offset, right: 16 };
  }
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      ...options
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove after duration
    const duration = options.duration !== undefined ? options.duration : 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const removeAllToasts = () => {
    setToasts([]);
  };

  // Convenience methods
  const success = (message, options) => addToast(message, 'success', options);
  const error = (message, options) => addToast(message, 'error', options);
  const warning = (message, options) => addToast(message, 'warning', options);
  const info = (message, options) => addToast(message, 'info', options);

  return {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    warning,
    info
  };
};

export default Toast;