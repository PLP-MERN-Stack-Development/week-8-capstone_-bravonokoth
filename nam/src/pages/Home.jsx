import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  TruckIcon, 
  ShieldCheckIcon, 
  ClockIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import FishCard from '../components/FishCard';

const Home = () => {
  const [featuredFish, setFeaturedFish] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { API_BASE_URL } = useAuth();

  useEffect(() => {
    fetchFeaturedFish();
  }, []);

  const fetchFeaturedFish = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/fish?featured=true&limit=6`);
      if (response.data.success) {
        setFeaturedFish(response.data.data.fish);
      }
    } catch (error) {
      console.error('Error fetching featured fish:', error);
      // Fallback to regular fish if featured fish endpoint fails
      try {
        const fallbackResponse = await axios.get(`${API_BASE_URL}/fish?limit=6`);
        if (fallbackResponse.data.success) {
          setFeaturedFish(fallbackResponse.data.data.fish);
        }
      } catch (fallbackError) {
        console.error('Error fetching fallback fish:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to products page with search query
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const features = [
    {
      icon: TruckIcon,
      title: 'Fast Delivery',
      description: 'Fresh fish delivered to your doorstep within 24 hours'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Quality Guaranteed',
      description: 'Premium quality fish sourced directly from Lake Victoria'
    },
    {
      icon: ClockIcon,
      title: 'Always Fresh',
      description: 'Daily catch ensures maximum freshness and taste'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Mwangi',
      rating: 5,
      comment: 'Best fish delivery service in Nairobi! Always fresh and on time.',
      location: 'Westlands, Nairobi'
    },
    {
      name: 'John Kamau',
      rating: 5,
      comment: 'Great variety and excellent customer service. Highly recommended!',
      location: 'Karen, Nairobi'
    },
    {
      name: 'Grace Wanjiku',
      rating: 5,
      comment: 'The tilapia is always perfectly fresh. My family loves it!',
      location: 'Kileleshwa, Nairobi'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-100 overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-5"></div>
        <div className="container-custom py-20 lg:py-32 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.h1 
                  className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                >
                  Fresh Fish
                  <span className="text-gradient block">Delivered Daily</span>
                </motion.h1>
                <motion.p 
                  className="text-xl text-gray-600 max-w-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  Premium quality tilapia, omena, catfish, and nile perch delivered fresh to your doorstep across Nairobi.
                </motion.p>
              </div>

              {/* Search Bar */}
              <motion.form
                onSubmit={handleSearch}
                className="flex items-center bg-white rounded-2xl shadow-soft p-2 max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <input
                  type="text"
                  placeholder="Search for fish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 bg-transparent border-none outline-none"
                />
                <motion.button
                  type="submit"
                  className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-3 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </motion.button>
              </motion.form>

              {/* CTA Buttons */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <Link to="/products" className="btn btn-primary btn-lg group">
                  <span>Shop Now</span>
                  <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
                <Link to="/about" className="btn btn-outline btn-lg">
                  Learn More
                </Link>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl p-8 shadow-hard"
                >
                  <div className="text-center text-white">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-8xl mb-4"
                    >
                      🐟
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-2">Fresh Daily Catch</h3>
                    <p className="text-primary-100">From Lake Victoria to your table</p>
                  </div>
                </motion.div>
                
                {/* Floating elements */}
                <motion.div
                  animate={{ 
                    y: [0, -15, 0],
                    x: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-medium"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-900">Fresh Stock</span>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ 
                    y: [0, -8, 0],
                    x: [0, -3, 0]
                  }}
                  transition={{ 
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-medium"
                >
                  <div className="flex items-center space-x-2">
                    <TruckIcon className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-medium text-gray-900">Fast Delivery</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose FreshCatch?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to delivering the freshest fish with unmatched quality and service.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="text-center group"
              >
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl mb-6 group-hover:from-primary-200 group-hover:to-primary-300 transition-all duration-300"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Fish Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Featured Fresh Catch
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our premium selection of fresh fish, caught daily and delivered with care.
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="card p-6">
                  <div className="loading-skeleton h-48 rounded-lg mb-4"></div>
                  <div className="loading-skeleton h-4 rounded mb-2"></div>
                  <div className="loading-skeleton h-4 rounded w-2/3 mb-4"></div>
                  <div className="loading-skeleton h-10 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredFish.map((fish, index) => (
                <motion.div
                  key={fish._id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                >
                  <FishCard 
                    fish={fish} 
                    onAddToCart={(fish) => {
                      // Handle add to cart - this would typically update a cart context
                      console.log('Added to cart:', fish);
                    }}
                  />
                </motion.div>
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mt-12"
          >
            <Link to="/products" className="btn btn-primary btn-lg">
              View All Products
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust us for their fresh fish needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="card p-6 text-center"
              >
                <div className="flex justify-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-warning-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.comment}"</p>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Experience Fresh Fish Delivery?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join our community and get fresh fish delivered to your doorstep today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products" className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg">
                Start Shopping
              </Link>
              <Link to="/signup" className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 btn-lg">
                Create Account
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;