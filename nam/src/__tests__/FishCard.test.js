import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FishCard from '../components/FishCard';

describe('FishCard Component', () => {
  const mockFish = {
    _id: '1',
    type: 'tilapia',
    size: 4,
    pricePerKg: 800,
    stock: 50,
    description: 'Fresh tilapia from Lake Victoria',
    image: 'https://example.com/tilapia.jpg',
    isAvailable: true,
    stockStatus: 'in-stock'
  };

  const mockOnAddToCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders fish information correctly', () => {
      render(<FishCard fish={mockFish} onAddToCart={mockOnAddToCart} />);
      
      expect(screen.getByText('Tilapia')).toBeInTheDocument();
      expect(screen.getByText('Size 4')).toBeInTheDocument();
      expect(screen.getByText('KSh 800')).toBeInTheDocument();
      expect(screen.getByText('per kg')).toBeInTheDocument();
      expect(screen.getByText('50kg available')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(<FishCard fish={mockFish} onAddToCart={mockOnAddToCart} />);
      
      expect(screen.getByText('Fresh tilapia from Lake Victoria')).toBeInTheDocument();
    });

    it('renders fish image when provided', () => {
      render(<FishCard fish={mockFish} onAddToCart={mockOnAddToCart} />);
      
      const image = screen.getByAltText('Tilapia size 4');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/tilapia.jpg');
    });

    it('renders fish emoji when no image provided', () => {
      const fishWithoutImage = { ...mockFish, image: null };
      render(<FishCard fish={fishWithoutImage} onAddToCart={mockOnAddToCart} />);
      
      expect(screen.getByText('🐟')).toBeInTheDocument();
    });

    it('formats fish type with proper capitalization', () => {
      const fishTypes = ['tilapia', 'omena', 'catfish', 'nileperch'];
      
      fishTypes.forEach(type => {
        const fish = { ...mockFish, type };
        const { rerender } = render(<FishCard fish={fish} onAddToCart={mockOnAddToCart} />);
        
        const expectedText = type.charAt(0).toUpperCase() + type.slice(1);
        expect(screen.getByText(expectedText)).toBeInTheDocument();
        
        rerender(<div />); // Clear for next iteration
      });
    });
  });

  describe('Stock Status', () => {
    it('shows "In Stock" badge for available fish', () => {
      render(<FishCard fish={mockFish} onAddToCart={mockOnAddToCart} />);
      
      expect(screen.getByText('In Stock')).toBeInTheDocument();
    });

    it('shows "Low Stock" badge for low stock fish', () => {
      const lowStockFish = {
        ...mockFish,
        stock: 5,
        stockStatus: 'low-stock'
      };
      
      render(<FishCard fish={lowStockFish} onAddToCart={mockOnAddToCart} />);
      
      expect(screen.getByText('Low Stock')).toBeInTheDocument();
      expect(screen.getByText('Only 5kg left!')).toBeInTheDocument();
    });

    it('shows "Out of Stock" badge for unavailable fish', () => {
      const outOfStockFish = {
        ...mockFish,
        stock: 0,
        isAvailable: false,
        stockStatus: 'out-of-stock'
      };
      
      render(<FishCard fish={outOfStockFish} onAddToCart={mockOnAddToCart} />);
      
      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    });
  });

  describe('Add to Cart Functionality', () => {
    it('renders "Add to Cart" button for available fish', () => {
      render(<FishCard fish={mockFish} onAddToCart={mockOnAddToCart} />);
      
      const addToCartButton = screen.getByText('Add to Cart');
      expect(addToCartButton).toBeInTheDocument();
      expect(addToCartButton).not.toBeDisabled();
    });

    it('calls onAddToCart when button is clicked', () => {
      render(<FishCard fish={mockFish} onAddToCart={mockOnAddToCart} />);
      
      const addToCartButton = screen.getByText('Add to Cart');
      fireEvent.click(addToCartButton);
      
      expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
      expect(mockOnAddToCart).toHaveBeenCalledWith(mockFish);
    });

    it('shows disabled "Out of Stock" button for unavailable fish', () => {
      const outOfStockFish = {
        ...mockFish,
        stock: 0,
        isAvailable: false,
        stockStatus: 'out-of-stock'
      };
      
      render(<FishCard fish={outOfStockFish} onAddToCart={mockOnAddToCart} />);
      
      const button = screen.getByText('Out of Stock');
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('does not call onAddToCart for out of stock fish', () => {
      const outOfStockFish = {
        ...mockFish,
        stock: 0,
        isAvailable: false,
        stockStatus: 'out-of-stock'
      };
      
      render(<FishCard fish={outOfStockFish} onAddToCart={mockOnAddToCart} />);
      
      const button = screen.getByText('Out of Stock');
      fireEvent.click(button);
      
      expect(mockOnAddToCart).not.toHaveBeenCalled();
    });

    it('handles missing onAddToCart prop gracefully', () => {
      render(<FishCard fish={mockFish} />);
      
      const addToCartButton = screen.getByText('Add to Cart');
      
      // Should not throw error when clicked without onAddToCart prop
      expect(() => {
        fireEvent.click(addToCartButton);
      }).not.toThrow();
    });
  });

  describe('Price Display', () => {
    it('formats price with proper currency and locale', () => {
      const expensiveFish = {
        ...mockFish,
        pricePerKg: 1500
      };
      
      render(<FishCard fish={expensiveFish} onAddToCart={mockOnAddToCart} />);
      
      expect(screen.getByText('KSh 1,500')).toBeInTheDocument();
    });

    it('handles zero price', () => {
      const freeFish = {
        ...mockFish,
        pricePerKg: 0
      };
      
      render(<FishCard fish={freeFish} onAddToCart={mockOnAddToCart} />);
      
      expect(screen.getByText('KSh 0')).toBeInTheDocument();
    });
  });

  describe('Size Badge', () => {
    it('displays size badge correctly', () => {
      render(<FishCard fish={mockFish} onAddToCart={mockOnAddToCart} />);
      
      expect(screen.getByText('Size 4')).toBeInTheDocument();
    });

    it('handles different size values', () => {
      const sizes = [2, 3, 4, 5, 6, 7, 8];
      
      sizes.forEach(size => {
        const fish = { ...mockFish, size };
        const { rerender } = render(<FishCard fish={fish} onAddToCart={mockOnAddToCart} />);
        
        expect(screen.getByText(`Size ${size}`)).toBeInTheDocument();
        
        rerender(<div />); // Clear for next iteration
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper alt text for images', () => {
      render(<FishCard fish={mockFish} onAddToCart={mockOnAddToCart} />);
      
      const image = screen.getByAltText('Tilapia size 4');
      expect(image).toBeInTheDocument();
    });

    it('has accessible button text', () => {
      render(<FishCard fish={mockFish} onAddToCart={mockOnAddToCart} />);
      
      const button = screen.getByRole('button', { name: /add to cart/i });
      expect(button).toBeInTheDocument();
    });

    it('provides proper button state for disabled buttons', () => {
      const outOfStockFish = {
        ...mockFish,
        stock: 0,
        isAvailable: false,
        stockStatus: 'out-of-stock'
      };
      
      render(<FishCard fish={outOfStockFish} onAddToCart={mockOnAddToCart} />);
      
      const button = screen.getByRole('button', { name: /out of stock/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className when provided', () => {
      const { container } = render(
        <FishCard fish={mockFish} onAddToCart={mockOnAddToCart} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies default styling when no className provided', () => {
      const { container } = render(
        <FishCard fish={mockFish} onAddToCart={mockOnAddToCart} />
      );
      
      expect(container.firstChild).toHaveClass('card');
    });
  });
});