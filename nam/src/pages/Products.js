import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FunnelIcon, 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import FishCard from '../components/FishCard';
import Cart from '../components/Cart';
import { useToast } from '../components/Toast';

const Products = () => {
  const [fish, setFish] = useState([]);
  const [filteredFish, setFilteredFish] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    size: '',
    minPrice: '',
    maxPrice: '',
    inStock: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });

  const { API_BASE_URL } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    fetchFish();
  }, [filters, pagination.currentPage, sortBy]);

  useEffect(() => {
    // Apply search filter
    if (searchQuery.trim()) {
      const filtered = fish.filter(fishItem =>
        fishItem.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fishItem.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFish(filtered);
    } else {
      setFilteredFish(fish);
    }
  }, [searchQuery, fish]);

  const fetchFish = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.size) params.append('size', filters.size);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.inStock) params.append('inStock', 'true');
      
      params.append('page', pagination.currentPage);
      params.append('limit', pagination.itemsPerPage);

      const response = await axios.get(`${API_BASE_URL}/fish?${params}`);
      
      if (response.data.success) {
        let fishData = response.data.data.fish;
        
        // Apply sorting
        fishData = sortFish(fishData, sortBy);
        
        setFish(fishData);
        setPagination(prev => ({
          ...prev,
          ...response.data.data.pagination
        }));
      }
    } catch (err) {
      console.error('Error fetching fish:', err);
      error('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sortFish = (fishArray, sortOption) => {
    const sorted = [...fishArray];
    
    switch (sortOption) {
      case 'name':
        return sorted.sort((a, b) => a.type.localeCompare(b.type));
      case 'price-low':
        return sorted.sort((a, b) => a.pricePerKg - b.pricePerKg);
      case 'price-high':
        return sorted.sort((a, b) => b.pricePerKg - a.pricePerKg);
      case 'size':
        return sorted.sort((a, b) => a.size - b.size);
      case 'stock':
        return sorted.sort((a, b) => b.stock - a.stock);
      default:
        return sorted;
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      size: '',
      minPrice: '',
      maxPrice: '',
      inStock: false
    });
    setSearchQuery('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleAddToCart = (fishItem) => {
    const existingItem = cartItems.find(item => item._id === fishItem._id);
    
    if (existingItem) {
      setCartItems(prev =>
        prev.map(item =>
          item._id === fishItem._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems(prev => [...prev, { ...fishItem, quantity: 1 }]);
    }
    
    success(`${fishItem.type.charAt(0).toUpperCase() + fishItem.type.slice(1)} added to cart!`);
  };

  const handleUpdateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveFromCart(itemId);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item._id === itemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleRemoveFromCart = (itemId) => {
    setCartItems(prev => prev.filter(item => item._id !== itemId));
  };

  const handleCheckout = (items, total) => {
    // Navigate to checkout or handle checkout logic
    console.log('Checkout:', { items, total });
    success('Proceeding to checkout...');
  };

  const formatFishType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const fishTypes = ['tilapia', 'omena', 'catfish', 'nileperch'];
  const fishSizes = [2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Fresh Fish Products
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Discover our premium selection of fresh fish, caught daily and delivered with care.
          </p>
        </motion.div>

        {/* Search and Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-soft p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search fish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="size">Size</option>
              <option value="stock">Stock Level</option>
            </select>

            {/* Filter Toggle */}
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FunnelIcon className="w-5 h-5" />
              <span>Filters</span>
            </motion.button>

            {/* Cart Button */}
            <motion.button
              onClick={() => setShowCart(true)}
              className="btn btn-primary flex items-center space-x-2 relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Cart</span>
              {cartItems.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-error-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
                >
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </motion.span>
              )}
            </motion.button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 pt-6 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Fish Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fish Type
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">All Types</option>
                      {fishTypes.map(type => (
                        <option key={type} value={type}>
                          {formatFishType(type)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Size Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size
                    </label>
                    <select
                      value={filters.size}
                      onChange={(e) => handleFilterChange('size', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">All Sizes</option>
                      {fishSizes.map(size => (
                        <option key={size} value={size}>
                          Size {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Min Price Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Price (KSh)
                    </label>
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Max Price Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Price (KSh)
                    </label>
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      placeholder="10000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* In Stock Filter */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="inStock"
                      checked={filters.inStock}
                      onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="inStock" className="ml-2 block text-sm text-gray-900">
                      In Stock Only
                    </label>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="mt-4 flex justify-end">
                  <motion.button
                    onClick={clearFilters}
                    className="btn btn-ghost text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Clear All Filters
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, index) => (
              <div key={index} className="card p-6">
                <div className="loading-skeleton h-48 rounded-lg mb-4"></div>
                <div className="loading-skeleton h-4 rounded mb-2"></div>
                <div className="loading-skeleton h-4 rounded w-2/3 mb-4"></div>
                <div className="loading-skeleton h-10 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredFish.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🐟</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No fish found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <motion.button
              onClick={clearFilters}
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear Filters
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFish.map((fishItem, index) => (
              <motion.div
                key={fishItem._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <FishCard
                  fish={fishItem}
                  onAddToCart={handleAddToCart}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 flex justify-center"
          >
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
                className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: pagination.currentPage === 1 ? 1 : 1.05 }}
                whileTap={{ scale: pagination.currentPage === 1 ? 1 : 0.95 }}
              >
                Previous
              </motion.button>
              
              {[...Array(pagination.totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <motion.button
                    key={page}
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
                    className={`btn ${
                      pagination.currentPage === page ? 'btn-primary' : 'btn-outline'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {page}
                  </motion.button>
                );
              })}
              
              <motion.button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: pagination.currentPage === pagination.totalPages ? 1 : 1.05 }}
                whileTap={{ scale: pagination.currentPage === pagination.totalPages ? 1 : 0.95 }}
              >
                Next
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Cart Sidebar */}
      <Cart
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
};

export default Products;