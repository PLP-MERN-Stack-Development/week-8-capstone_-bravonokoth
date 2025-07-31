import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  ChartBarIcon,
  UsersIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [fish, setFish] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddFishModal, setShowAddFishModal] = useState(false);
  const [editingFish, setEditingFish] = useState(null);
  const { API_BASE_URL } = useAuth();

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'inventory', name: 'Fish Inventory', icon: ShoppingBagIcon },
    { id: 'orders', name: 'Orders', icon: ShoppingBagIcon },
    { id: 'users', name: 'Users', icon: UsersIcon },
  ];

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [fishRes, ordersRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/fish`),
        axios.get(`${API_BASE_URL}/orders`),
        axios.get(`${API_BASE_URL}/orders/stats/summary`)
      ]);

      setFish(fishRes.data.data.fish || []);
      setOrders(ordersRes.data.data.orders || []);
      setStats(statsRes.data.data || {});
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFishType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/${orderId}`, { status: newStatus });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Overview Tab Component
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Orders',
            value: stats.summary?.totalOrders || 0,
            icon: ShoppingBagIcon,
            color: 'text-primary-600 bg-primary-100'
          },
          {
            title: 'Total Revenue',
            value: `KSh ${(stats.summary?.totalRevenue || 0).toLocaleString()}`,
            icon: CurrencyDollarIcon,
            color: 'text-success-600 bg-success-100'
          },
          {
            title: 'Fish Types',
            value: fish.length,
            icon: ShoppingBagIcon,
            color: 'text-blue-600 bg-blue-100'
          },
          {
            title: 'Avg Order Value',
            value: `KSh ${Math.round(stats.summary?.avgOrderValue || 0).toLocaleString()}`,
            icon: ChartBarIcon,
            color: 'text-purple-600 bg-purple-100'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
        <div className="space-y-3">
          {orders.slice(0, 5).map((order, index) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                <p className="text-sm text-gray-500">{order.userId?.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">KSh {order.totalPrice?.toLocaleString()}</p>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  // Inventory Tab Component
  const InventoryTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Fish Inventory</h3>
        <motion.button
          onClick={() => setShowAddFishModal(true)}
          className="btn btn-primary flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Fish</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fish.map((fishItem, index) => (
          <motion.div
            key={fishItem._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{formatFishType(fishItem.type)}</h4>
                <p className="text-sm text-gray-500">Size {fishItem.size}</p>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={() => setEditingFish(fishItem)}
                  className="p-2 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <PencilIcon className="w-4 h-4" />
                </motion.button>
                <motion.button
                  className="p-2 text-gray-400 hover:text-error-600 transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <TrashIcon className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Price</span>
                <span className="font-medium">KSh {fishItem.pricePerKg?.toLocaleString()}/kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Stock</span>
                <span className={`font-medium ${fishItem.stock <= 10 ? 'text-warning-600' : 'text-success-600'}`}>
                  {fishItem.stock}kg
                </span>
              </div>
            </div>

            {fishItem.stock <= 10 && (
              <div className="mt-3 p-2 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-xs text-warning-700">Low stock warning!</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Orders Tab Component
  const OrdersTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Order Management</h3>
      
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order, index) => (
                <motion.tr
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-gray-900">{order.userId?.name}</p>
                    <p className="text-sm text-gray-500">{order.userId?.email}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">KSh {order.totalPrice?.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                      className={`text-xs font-medium rounded-full px-3 py-1 border-0 ${getStatusColor(order.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <motion.button
                      className="text-primary-600 hover:text-primary-900"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner w-8 h-8"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your fish delivery platform</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </motion.button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'inventory' && <InventoryTab />}
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'users' && (
              <div className="text-center py-12">
                <p className="text-gray-500">User management coming soon...</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;