// API Configuration
};

// Default Fish Images (fallback)
export const DEFAULT_FISH_IMAGES = {
  tilapia: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
  omena: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
  catfish: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
  nileperch: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
};

// Utility Functions
export const formatCurrency = (amount) => {
  return `${PRICING.CURRENCY} ${amount.toLocaleString()}`;
};

export const formatFishType = (type) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

export const getStockStatus = (stock) => {
  if (stock === 0) return 'out-of-stock';
  if (stock <= 10) return 'low-stock';
  return 'in-stock';
};

export const getStockStatusConfig = (status) => {
  const configs = {
    'in-stock': { label: 'In Stock', color: 'success' },
    'low-stock': { label: 'Low Stock', color: 'warning' },
    'out-of-stock': { label: 'Out of Stock', color: 'error' },
  };
  return configs[status] || configs['out-of-stock'];
};