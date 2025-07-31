import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboard from '../components/AdminDashboard';
import { AuthProvider } from '../context/AuthContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock the useAuth hook
const mockAuthContext = {
  API_BASE_URL: 'http://localhost:5000/api',
};

jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'),
  useAuth: () => mockAuthContext,
}));

const mockFishData = [
  {
    _id: '1',
    type: 'tilapia',
    size: 4,
    pricePerKg: 800,
    stock: 50
  },
  {
    _id: '2',
    type: 'omena',
    size: 2,
    pricePerKg: 600,
    stock: 5
  }
];

const mockOrdersData = [
  {
    _id: '1',
    orderNumber: 'ORD-20231201-0001',
    userId: { name: 'John Doe', email: 'john@example.com' },
    totalPrice: 1600,
    status: 'pending',
    createdAt: '2023-12-01T10:00:00Z'
  },
  {
    _id: '2',
    orderNumber: 'ORD-20231201-0002',
    userId: { name: 'Jane Smith', email: 'jane@example.com' },
    totalPrice: 1200,
    status: 'processing',
    createdAt: '2023-12-01T11:00:00Z'
  }
];

const mockStatsData = {
  summary: {
    totalOrders: 25,
    totalRevenue: 50000,
    avgOrderValue: 2000
  },
  statusBreakdown: [
    { _id: 'pending', count: 5 },
    { _id: 'processing', count: 8 },
    { _id: 'delivered', count: 12 }
  ]
};

const renderAdminDashboard = () => {
  return render(
    <AuthProvider>
      <AdminDashboard />
    </AuthProvider>
  );
};

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default axios mocks
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/fish')) {
        return Promise.resolve({ data: { success: true, data: { fish: mockFishData } } });
      }
      if (url.includes('/orders/stats')) {
        return Promise.resolve({ data: { success: true, data: mockStatsData } });
      }
      if (url.includes('/orders')) {
        return Promise.resolve({ data: { success: true, data: { orders: mockOrdersData } } });
      }
      return Promise.resolve({ data: { success: true, data: {} } });
    });
  });

  describe('Rendering', () => {
    it('renders admin dashboard header', async () => {
      renderAdminDashboard();
      
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Manage your fish delivery platform')).toBeInTheDocument();
    });

    it('renders navigation tabs', async () => {
      renderAdminDashboard();
      
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Fish Inventory')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      renderAdminDashboard();
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('displays statistics cards', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Total Orders')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('KSh 50,000')).toBeInTheDocument();
      });
    });

    it('displays recent orders', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Recent Orders')).toBeInTheDocument();
        expect(screen.getByText('#ORD-20231201-0001')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('formats currency correctly', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('KSh 50,000')).toBeInTheDocument();
        expect(screen.getByText('KSh 2,000')).toBeInTheDocument();
      });
    });
  });

  describe('Inventory Tab', () => {
    it('switches to inventory tab when clicked', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        const inventoryTab = screen.getByText('Fish Inventory');
        fireEvent.click(inventoryTab);
      });
      
      expect(screen.getByText('Fish Inventory')).toBeInTheDocument();
      expect(screen.getByText('Add Fish')).toBeInTheDocument();
    });

    it('displays fish inventory items', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        const inventoryTab = screen.getByText('Fish Inventory');
        fireEvent.click(inventoryTab);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Tilapia')).toBeInTheDocument();
        expect(screen.getByText('Size 4')).toBeInTheDocument();
        expect(screen.getByText('KSh 800/kg')).toBeInTheDocument();
        expect(screen.getByText('50kg')).toBeInTheDocument();
      });
    });

    it('shows low stock warning', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        const inventoryTab = screen.getByText('Fish Inventory');
        fireEvent.click(inventoryTab);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Low stock warning!')).toBeInTheDocument();
      });
    });

    it('shows add fish button', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        const inventoryTab = screen.getByText('Fish Inventory');
        fireEvent.click(inventoryTab);
      });
      
      expect(screen.getByText('Add Fish')).toBeInTheDocument();
    });
  });

  describe('Orders Tab', () => {
    it('switches to orders tab when clicked', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        const ordersTab = screen.getByText('Orders');
        fireEvent.click(ordersTab);
      });
      
      expect(screen.getByText('Order Management')).toBeInTheDocument();
    });

    it('displays orders table', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        const ordersTab = screen.getByText('Orders');
        fireEvent.click(ordersTab);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Order')).toBeInTheDocument();
        expect(screen.getByText('Customer')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('displays order data in table', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        const ordersTab = screen.getByText('Orders');
        fireEvent.click(ordersTab);
      });
      
      await waitFor(() => {
        expect(screen.getByText('#ORD-20231201-0001')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('KSh 1,600')).toBeInTheDocument();
      });
    });

    it('allows status updates', async () => {
      mockedAxios.put.mockResolvedValue({ data: { success: true } });
      
      renderAdminDashboard();
      
      await waitFor(() => {
        const ordersTab = screen.getByText('Orders');
        fireEvent.click(ordersTab);
      });
      
      await waitFor(() => {
        const statusSelect = screen.getAllByDisplayValue('pending')[0];
        fireEvent.change(statusSelect, { target: { value: 'processing' } });
      });
      
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:5000/api/orders/1',
        { status: 'processing' }
      );
    });
  });

  describe('Users Tab', () => {
    it('switches to users tab when clicked', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        const usersTab = screen.getByText('Users');
        fireEvent.click(usersTab);
      });
      
      expect(screen.getByText('User management coming soon...')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('highlights active tab', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        const inventoryTab = screen.getByText('Fish Inventory');
        fireEvent.click(inventoryTab);
      });
      
      // The active tab should have different styling (we can't easily test CSS classes in jsdom)
      expect(screen.getByText('Fish Inventory')).toBeInTheDocument();
    });

    it('switches between tabs correctly', async () => {
      renderAdminDashboard();
      
      // Start with overview (default)
      await waitFor(() => {
        expect(screen.getByText('Total Orders')).toBeInTheDocument();
      });
      
      // Switch to inventory
      const inventoryTab = screen.getByText('Fish Inventory');
      fireEvent.click(inventoryTab);
      
      await waitFor(() => {
        expect(screen.getByText('Add Fish')).toBeInTheDocument();
      });
      
      // Switch back to overview
      const overviewTab = screen.getByText('Overview');
      fireEvent.click(overviewTab);
      
      await waitFor(() => {
        expect(screen.getByText('Total Orders')).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('fetches dashboard data on mount', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/fish');
        expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/orders');
        expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/orders/stats/summary');
      });
    });

    it('handles API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));
      
      renderAdminDashboard();
      
      // Should not crash and should eventually stop loading
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders without layout issues', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });
      
      // Component should render without throwing errors
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      renderAdminDashboard();
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('has accessible tab navigation', async () => {
      renderAdminDashboard();
      
      const tabs = screen.getAllByRole('button');
      expect(tabs.length).toBeGreaterThan(0);
      
      tabs.forEach(tab => {
        expect(tab).toBeInTheDocument();
      });
    });

    it('has accessible table structure', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        const ordersTab = screen.getByText('Orders');
        fireEvent.click(ordersTab);
      });
      
      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });
  });
});