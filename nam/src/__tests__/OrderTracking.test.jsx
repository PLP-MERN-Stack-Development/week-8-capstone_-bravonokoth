import React from 'react';
import { render, screen } from '@testing-library/react';
import OrderTracking from '../components/OrderTracking';
import { AuthProvider } from '../context/AuthContext';

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connected: true,
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

// Mock the useAuth hook
const mockAuthContext = {
  API_BASE_URL: 'http://localhost:5000/api',
};

jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'),
  useAuth: () => mockAuthContext,
}));

const mockOrder = {
  _id: '1',
  orderNumber: 'ORD-20231201-0001',
  status: 'processing',
  totalPrice: 1600,
  deliveryFee: 100,
  deliveryAddress: '123 Main Street, Nairobi',
  estimatedDelivery: '2023-12-05T10:00:00Z',
  createdAt: '2023-12-01T10:00:00Z',
  updatedAt: '2023-12-02T10:00:00Z',
  items: [
    {
      fishId: 'fish1',
      fishType: 'tilapia',
      fishSize: 4,
      quantity: 2,
      pricePerKg: 800,
      subtotal: 1600
    }
  ]
};

const renderOrderTracking = (order = mockOrder) => {
  return render(
    <AuthProvider>
      <OrderTracking order={order} />
    </AuthProvider>
  );
};

describe('OrderTracking Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders order information correctly', () => {
      renderOrderTracking();
      
      expect(screen.getByText('Order #ORD-20231201-0001')).toBeInTheDocument();
      expect(screen.getByText(/Placed on/)).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
    });

    it('renders order items correctly', () => {
      renderOrderTracking();
      
      expect(screen.getByText('Order Items')).toBeInTheDocument();
      expect(screen.getByText('Tilapia (Size 4)')).toBeInTheDocument();
      expect(screen.getByText('2kg × KSh 800')).toBeInTheDocument();
      expect(screen.getByText('KSh 1,600')).toBeInTheDocument();
    });

    it('renders order summary correctly', () => {
      renderOrderTracking();
      
      expect(screen.getByText('KSh 1,600')).toBeInTheDocument(); // Subtotal
      expect(screen.getByText('KSh 100')).toBeInTheDocument(); // Delivery fee
      expect(screen.getByText('KSh 1,700')).toBeInTheDocument(); // Total
    });

    it('renders delivery address when provided', () => {
      renderOrderTracking();
      
      expect(screen.getByText('Delivery Address')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street, Nairobi')).toBeInTheDocument();
    });

    it('shows no order data message when order is null', () => {
      renderOrderTracking(null);
      
      expect(screen.getByText('No order data available')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('displays pending status correctly', () => {
      const pendingOrder = { ...mockOrder, status: 'pending' };
      renderOrderTracking(pendingOrder);
      
      expect(screen.getByText('Order Pending')).toBeInTheDocument();
      expect(screen.getByText('Your order has been received and is being reviewed.')).toBeInTheDocument();
    });

    it('displays processing status correctly', () => {
      renderOrderTracking();
      
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Your order is being prepared for shipment.')).toBeInTheDocument();
    });

    it('displays shipped status correctly', () => {
      const shippedOrder = { ...mockOrder, status: 'shipped' };
      renderOrderTracking(shippedOrder);
      
      expect(screen.getByText('Shipped')).toBeInTheDocument();
      expect(screen.getByText('Your order is on its way to you.')).toBeInTheDocument();
    });

    it('displays delivered status correctly', () => {
      const deliveredOrder = { ...mockOrder, status: 'delivered' };
      renderOrderTracking(deliveredOrder);
      
      expect(screen.getByText('Delivered')).toBeInTheDocument();
      expect(screen.getByText('Your order has been successfully delivered.')).toBeInTheDocument();
    });

    it('displays cancelled status correctly', () => {
      const cancelledOrder = { ...mockOrder, status: 'cancelled' };
      renderOrderTracking(cancelledOrder);
      
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
      expect(screen.getByText('Your order has been cancelled.')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('shows correct progress for pending status', () => {
      const pendingOrder = { ...mockOrder, status: 'pending' };
      renderOrderTracking(pendingOrder);
      
      // Should show all status steps
      expect(screen.getByText('Order Pending')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Shipped')).toBeInTheDocument();
      expect(screen.getByText('Delivered')).toBeInTheDocument();
    });

    it('shows correct progress for processing status', () => {
      renderOrderTracking();
      
      // All status steps should be visible
      expect(screen.getByText('Order Pending')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Shipped')).toBeInTheDocument();
      expect(screen.getByText('Delivered')).toBeInTheDocument();
    });

    it('handles cancelled orders correctly', () => {
      const cancelledOrder = { ...mockOrder, status: 'cancelled' };
      renderOrderTracking(cancelledOrder);
      
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('sets up socket connection on mount', () => {
      renderOrderTracking();
      
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('orderUpdate', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('joins order room on connection', () => {
      renderOrderTracking();
      
      // Simulate connection
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      connectHandler();
      
      expect(mockSocket.emit).toHaveBeenCalledWith('join-order-room', '1');
    });

    it('shows connection status', () => {
      renderOrderTracking();
      
      expect(screen.getByText('Live updates enabled')).toBeInTheDocument();
    });

    it('handles disconnection', () => {
      mockSocket.connected = false;
      renderOrderTracking();
      
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats dates correctly', () => {
      renderOrderTracking();
      
      // Should show formatted date
      expect(screen.getByText(/December/)).toBeInTheDocument();
    });

    it('shows estimated delivery when available', () => {
      renderOrderTracking();
      
      expect(screen.getByText(/Estimated delivery:/)).toBeInTheDocument();
    });

    it('shows last updated time', () => {
      renderOrderTracking();
      
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  describe('Multiple Items', () => {
    it('renders multiple order items correctly', () => {
      const multiItemOrder = {
        ...mockOrder,
        items: [
          {
            fishId: 'fish1',
            fishType: 'tilapia',
            fishSize: 4,
            quantity: 2,
            pricePerKg: 800,
            subtotal: 1600
          },
          {
            fishId: 'fish2',
            fishType: 'omena',
            fishSize: 2,
            quantity: 1,
            pricePerKg: 600,
            subtotal: 600
          }
        ],
        totalPrice: 2200
      };
      
      renderOrderTracking(multiItemOrder);
      
      expect(screen.getByText('Tilapia (Size 4)')).toBeInTheDocument();
      expect(screen.getByText('Omena (Size 2)')).toBeInTheDocument();
      expect(screen.getByText('KSh 2,200')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing order data gracefully', () => {
      renderOrderTracking(undefined);
      
      expect(screen.getByText('No order data available')).toBeInTheDocument();
    });

    it('handles missing order items', () => {
      const orderWithoutItems = { ...mockOrder, items: [] };
      renderOrderTracking(orderWithoutItems);
      
      // Should still render order info
      expect(screen.getByText('Order #ORD-20231201-0001')).toBeInTheDocument();
    });

    it('handles missing delivery address', () => {
      const orderWithoutAddress = { ...mockOrder, deliveryAddress: null };
      renderOrderTracking(orderWithoutAddress);
      
      // Should not show delivery address section
      expect(screen.queryByText('Delivery Address')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      renderOrderTracking();
      
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
    });

    it('provides meaningful text for status indicators', () => {
      renderOrderTracking();
      
      // Status should be clearly indicated
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Your order is being prepared for shipment.')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className when provided', () => {
      const { container } = render(
        <AuthProvider>
          <OrderTracking order={mockOrder} className="custom-class" />
        </AuthProvider>
      );
      
      expect(container.firstChild.firstChild).toHaveClass('custom-class');
    });
  });
});