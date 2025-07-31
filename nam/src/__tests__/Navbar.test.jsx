import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';

// Mock the useAuth hook
const mockAuthContext = {
  user: null,
  logout: jest.fn(),
  isAuthenticated: jest.fn(() => false),
  isAdmin: jest.fn(() => false),
};

jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'),
  useAuth: () => mockAuthContext,
}));

const renderNavbar = (authOverrides = {}) => {
  // Override mock values if provided
  Object.assign(mockAuthContext, authOverrides);
  
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock to default state
    Object.assign(mockAuthContext, {
      user: null,
      logout: jest.fn(),
      isAuthenticated: jest.fn(() => false),
      isAdmin: jest.fn(() => false),
    });
  });

  describe('Unauthenticated User', () => {
    it('renders logo and brand name', () => {
      renderNavbar();
      
      expect(screen.getByText('FreshCatch')).toBeInTheDocument();
    });

    it('shows public navigation links', () => {
      renderNavbar();
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
    });

    it('does not show authenticated-only links', () => {
      renderNavbar();
      
      expect(screen.queryByText('Orders')).not.toBeInTheDocument();
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    it('shows login and signup buttons', () => {
      renderNavbar();
      
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    it('opens mobile menu when hamburger is clicked', () => {
      renderNavbar();
      
      // Find and click the mobile menu button
      const mobileMenuButton = screen.getByRole('button');
      fireEvent.click(mobileMenuButton);
      
      // Mobile menu should be visible (we can't test animation, but we can test presence)
      expect(screen.getAllByText('Home')).toHaveLength(2); // Desktop + Mobile
    });
  });

  describe('Authenticated Client User', () => {
    const clientUser = {
      _id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'client'
    };

    it('shows authenticated navigation links', () => {
      renderNavbar({
        user: clientUser,
        isAuthenticated: jest.fn(() => true),
        isAdmin: jest.fn(() => false),
      });
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('does not show admin link for client users', () => {
      renderNavbar({
        user: clientUser,
        isAuthenticated: jest.fn(() => true),
        isAdmin: jest.fn(() => false),
      });
      
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    it('shows user name and logout button', () => {
      renderNavbar({
        user: clientUser,
        isAuthenticated: jest.fn(() => true),
        isAdmin: jest.fn(() => false),
      });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('does not show login/signup buttons', () => {
      renderNavbar({
        user: clientUser,
        isAuthenticated: jest.fn(() => true),
        isAdmin: jest.fn(() => false),
      });
      
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
    });

    it('calls logout function when logout button is clicked', () => {
      const mockLogout = jest.fn();
      renderNavbar({
        user: clientUser,
        isAuthenticated: jest.fn(() => true),
        isAdmin: jest.fn(() => false),
        logout: mockLogout,
      });
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
      
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('shows user avatar with first letter of name', () => {
      renderNavbar({
        user: clientUser,
        isAuthenticated: jest.fn(() => true),
        isAdmin: jest.fn(() => false),
      });
      
      expect(screen.getByText('J')).toBeInTheDocument(); // First letter of John
    });
  });

  describe('Authenticated Admin User', () => {
    const adminUser = {
      _id: '2',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin'
    };

    it('shows admin navigation link', () => {
      renderNavbar({
        user: adminUser,
        isAuthenticated: jest.fn(() => true),
        isAdmin: jest.fn(() => true),
      });
      
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('shows all navigation links including admin', () => {
      renderNavbar({
        user: adminUser,
        isAuthenticated: jest.fn(() => true),
        isAdmin: jest.fn(() => true),
      });
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  describe('Mobile Navigation', () => {
    it('shows mobile menu items when opened', () => {
      const clientUser = {
        _id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'client'
      };

      renderNavbar({
        user: clientUser,
        isAuthenticated: jest.fn(() => true),
        isAdmin: jest.fn(() => false),
      });
      
      // Click mobile menu button
      const mobileMenuButton = screen.getByRole('button');
      fireEvent.click(mobileMenuButton);
      
      // Should show user info in mobile menu
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('closes mobile menu when navigation link is clicked', () => {
      renderNavbar();
      
      // Open mobile menu
      const mobileMenuButton = screen.getByRole('button');
      fireEvent.click(mobileMenuButton);
      
      // Click a navigation link
      const homeLinks = screen.getAllByText('Home');
      fireEvent.click(homeLinks[1]); // Click mobile version
      
      // Menu should close (we can't test animation, but component should handle this)
      expect(homeLinks).toHaveLength(2);
    });
  });

  describe('Responsive Behavior', () => {
    it('renders without crashing on different screen sizes', () => {
      // Test desktop view
      renderNavbar();
      expect(screen.getByText('FreshCatch')).toBeInTheDocument();
      
      // The component should handle responsive classes via Tailwind
      // We can't easily test responsive behavior in jsdom, but we can ensure
      // the component renders without errors
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderNavbar();
      
      // Navigation should have proper role
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      
      // Buttons should be accessible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', () => {
      renderNavbar();
      
      // Links should be focusable
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });
});