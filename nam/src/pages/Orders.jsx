import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EyeIcon, 
  ClockIcon, 
  TruckIcon, 
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import OrderTracking from '../components/OrderTracking';
import { useToast } from '../components/Toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  const { API_BASE_URL, isAdmin } = useAuth();
  const { error } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [pagination.currentPage, statusFilter]);

  useEffect(() => {
    // Apply search filter
    if (searchQuery.trim()) {
      const filtered = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchQuery, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.currentPage);
      params.append('limit', pagination.itemsPerPage);

      const response = await axios.get(`${API_BASE_URL}/orders?${params}`);
      
      if (response.data.success) {
        setOrders(response.data.data.orders);
        setPagination(prev => ({
          ...prev,
          ...response.data.data.pagination
        }));
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      error('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`);
      if (response.data.success) {
        setSelectedOrder(response.data.data.order);
        setShowOrderDetails(true);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      error('Failed to load order details. Please try again.');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!isAdmin()) {
      error('Only admins can update order status.');
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/orders/${orderId}`, { status: newStatus });
      fetchOrders(); // Refresh orders list
      if (selectedOrder && selectedOrder._id === orderId) {
        fetchOrderDetails(orderId); // Refresh order details if currently viewing
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      error('Failed to update order status. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: ClockIcon,
      processing: ClockIcon,
      shipped: TruckIcon,
      delivered: CheckCircleIcon,
      cancelled: XCircleIcon
    };
    return icons[status] || ClockIcon;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-warning-600 bg-warning-100',
      processing: 'text-primary-600 bg-primary-100',
      shipped: 'text-blue-600 bg-blue-100',
      delivered: 'text-success-600 bg-success-100',
      cancelled: 'text-error-600 bg-error-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFishType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

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
            {isAdmin() ? 'Order Management' : 'My Orders'}
          </h1>
          <p className="text-gray-600">
            {isAdmin() 
              ? 'Manage and track all customer orders' 
              : 'Track your fish delivery orders'
            }
          </p>
        </motion.div>

        {/* Search and Filters */}
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
                placeholder={isAdmin() ? "Search by order number, customer name, or email..." : "Search by order number..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="loading-skeleton h-4 rounded mb-2 w-1/4"></div>
                    <div className="loading-skeleton h-4 rounded mb-2 w-1/3"></div>
                    <div className="loading-skeleton h-4 rounded w-1/2"></div>
                  </div>
                  <div className="loading-skeleton h-8 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || statusFilter 
                ? "Try adjusting your search or filters." 
                : "You haven't placed any orders yet."
              }
            </p>
            {!searchQuery && !statusFilter && (
              <motion.button
                onClick={() => window.location.href = '/products'}
                className="btn btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Shopping
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const StatusIcon = getStatusIcon(order.status);
              
              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card p-6 hover:shadow-medium transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          #{order.orderNumber}
                        </h3>
                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        {isAdmin() && (
                          <div>
                            <span className="font-medium">Customer:</span>
                            <p>{order.userId?.name}</p>
                            <p className="text-xs">{order.userId?.email}</p>
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Order Date:</span>
                          <p>{formatDate(order.createdAt)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Items:</span>
                          <p>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div>
                          <span className="font-medium">Total:</span>
                          <p className="text-lg font-semibold text-primary-600">
                            KSh {order.totalPrice?.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                          {order.items?.slice(0, 3).map((item, itemIndex) => (
                            <span
                              key={itemIndex}
                              className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {formatFishType(item.fishType)} (Size {item.fishSize}) - {item.quantity}kg
                            </span>
                          ))}
                          {order.items?.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              +{order.items.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 ml-6">
                      {/* Status Update (Admin Only) */}
                      {isAdmin() && (
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* View Details Button */}
                      <motion.button
                        onClick={() => fetchOrderDetails(order._id)}
                        className="btn btn-outline btn-sm flex items-center space-x-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>View</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex justify-center"
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

      {/* Order Details Modal */}
      <AnimatePresence>
        {showOrderDetails && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowOrderDetails(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-hard max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                  <motion.button
                    onClick={() => setShowOrderDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XCircleIcon className="w-6 h-6 text-gray-500" />
                  </motion.button>
                </div>
                
                <OrderTracking order={selectedOrder} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;