import React from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, TagIcon } from '@heroicons/react/24/outline';

const FishCard = ({ fish, onAddToCart, className = '' }) => {
  const {
    _id,
    type,
    size,
    pricePerKg,
    stock,
    description,
    image,
    isAvailable = stock > 0,
    stockStatus = stock === 0 ? 'out-of-stock' : stock <= 10 ? 'low-stock' : 'in-stock'
  } = fish;

  const formatFishType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getStockBadge = () => {
    const badges = {
      'in-stock': { text: 'In Stock', className: 'badge-success' },
      'low-stock': { text: 'Low Stock', className: 'badge-warning' },
      'out-of-stock': { text: 'Out of Stock', className: 'badge-error' }
    };
    return badges[stockStatus] || badges['out-of-stock'];
  };

  const stockBadge = getStockBadge();

  const handleAddToCart = () => {
    if (onAddToCart && isAvailable) {
      onAddToCart(fish);
    }
  };

  return (
    <motion.div
      className={`card card-hover bg-white ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -8,
        boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15)'
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-100 aspect-fish">
        {image ? (
          <motion.img
            src={image}
            alt={`${formatFishType(type)} size ${size}`}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <motion.div 
            className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <motion.span 
              className="text-6xl opacity-50"
              animate={{ 
                rotateY: [0, 10, -10, 0],
                scale: [1, 1.1, 1] 
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse" 
              }}
            >
              🐟
            </motion.span>
          </motion.div>
        )}
        
        {/* Stock Badge */}
        <motion.div
          className="absolute top-3 right-3"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className={`badge ${stockBadge.className}`}>
            {stockBadge.text}
          </span>
        </motion.div>

        {/* Size Badge */}
        <motion.div
          className="absolute top-3 left-3"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="badge badge-primary flex items-center space-x-1">
            <TagIcon className="w-3 h-3" />
            <span>Size {size}</span>
          </span>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Fish Type and Price */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <motion.h3 
              className="text-lg font-semibold text-gray-900 mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {formatFishType(type)}
            </motion.h3>
            <motion.p 
              className="text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Size {size} • {stock}kg available
            </motion.p>
          </div>
          <motion.div 
            className="text-right"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-2xl font-bold text-primary-600">
              KSh {pricePerKg.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">per kg</p>
          </motion.div>
        </div>

        {/* Description */}
        {description && (
          <motion.p 
            className="text-sm text-gray-600 mb-4 line-clamp-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {description}
          </motion.p>
        )}

        {/* Add to Cart Button */}
        <motion.button
          onClick={handleAddToCart}
          disabled={!isAvailable}
          className={`w-full btn flex items-center justify-center space-x-2 ${
            isAvailable 
              ? 'btn-primary' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          whileHover={isAvailable ? { scale: 1.02 } : {}}
          whileTap={isAvailable ? { scale: 0.98 } : {}}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {isAvailable ? (
            <>
              <motion.div
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <PlusIcon className="w-4 h-4" />
              </motion.div>
              <span>Add to Cart</span>
            </>
          ) : (
            <span>Out of Stock</span>
          )}
        </motion.button>

        {/* Stock Warning */}
        {stockStatus === 'low-stock' && (
          <motion.p 
            className="text-xs text-warning-600 mt-2 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mr-1"
            >
              ⚠️
            </motion.span>
            Only {stock}kg left!
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default FishCard;