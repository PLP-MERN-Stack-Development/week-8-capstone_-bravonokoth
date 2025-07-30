import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Profile from '../pages/Profile';
import { AuthProvider } from '../context/AuthContext';

// Mock the useAuth hook
const mockAuthContext = {
  user: {
    _id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'client',
    deliveryAddress: '123 Main Street, Nairobi',
    phone: '+254712345678',
    createdAt: '2023-01-01T00:00:00Z'
  },
  updateProfile: jest.fn(),
  isClient: jest.fn(() => true),
};

jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'),
  useAuth: () => mockAuthContext,
}));

// Mock the useToast hook
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock('../components/Toast', () => ({
  ...jest.requireActual('../components/Toast'),
  useToast: () => mockToast,
}));

const renderProfile = (authOverrides = {}) => {
  // Override mock values if provided
  Object.assign(mockAuthContext, authOverrides);
  
  return render(
    <AuthProvider>
      <Profile />
    </AuthProvider>
  );
};

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock to default state
    Object.assign(mockAuthContext, {
      user: {
        _id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'client',
        deliveryAddress: '123 Main Street, Nairobi',
        phone: '+254712345678',
        createdAt: '2023-01-01T00:00:00Z'
      },
      updateProfile: jest.fn(),
      isClient: jest.fn(() => true),
    });
  });

  describe('Rendering', () => {
    it('renders profile header', () => {
      renderProfile();
      
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getByText('Manage your account information and preferences')).toBeInTheDocument();
    });

    it('renders user information in summary card', () => {
      renderProfile();
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('👤 Client')).toBeInTheDocument();
      expect(screen.getByText('J')).toBeInTheDocument(); // Avatar initial
    });

    it('shows admin badge for admin users', () => {
      renderProfile({
        user: { ...mockAuthContext.user, role: 'admin' },
        isClient: jest.fn(() => false),
      });
      
      expect(screen.getByText('👑 Admin')).toBeInTheDocument();
    });

    it('displays member since date', () => {
      renderProfile();
      
      expect(screen.getByText('Member since')).toBeInTheDocument();
      expect(screen.getByText('January 1, 2023')).toBeInTheDocument();
    });

    it('shows loading spinner when user is null', () => {
      renderProfile({ user: null });
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('displays all form fields with current values', () => {
      renderProfile();
      
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+254712345678')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123 Main Street, Nairobi')).toBeInTheDocument();
    });

    it('shows delivery address field for clients', () => {
      renderProfile();
      
      expect(screen.getByText('Delivery Address')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123 Main Street, Nairobi')).toBeInTheDocument();
    });

    it('hides delivery address requirement for admin users', () => {
      renderProfile({
        user: { ...mockAuthContext.user, role: 'admin', deliveryAddress: '' },
        isClient: jest.fn(() => false),
      });
      
      // Delivery address should still be present but not required
      expect(screen.getByText('Delivery Address')).toBeInTheDocument();
    });

    it('disables form fields when not in edit mode', () => {
      renderProfile();
      
      const nameInput = screen.getByDisplayValue('John Doe');
      expect(nameInput).toBeDisabled();
    });
  });

  describe('Edit Mode', () => {
    it('enables editing when edit button is clicked', () => {
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      const nameInput = screen.getByDisplayValue('John Doe');
      expect(nameInput).not.toBeDisabled();
      
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('shows password change option in edit mode', () => {
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      expect(screen.getByText('Change Password')).toBeInTheDocument();
    });

    it('shows password fields when change password is clicked', () => {
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      const changePasswordButton = screen.getByText('Change Password');
      fireEvent.click(changePasswordButton);
      
      expect(screen.getByPlaceholderText('Enter current password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter new password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
    });

    it('cancels editing when cancel button is clicked', () => {
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      // Make a change
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      // Should revert changes and disable fields
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: '' } });
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      const emailInput = screen.getByDisplayValue('john@example.com');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('validates phone number format', async () => {
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      const phoneInput = screen.getByDisplayValue('+254712345678');
      fireEvent.change(phoneInput, { target: { value: '123456' } });
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid Kenyan phone number')).toBeInTheDocument();
      });
    });

    it('validates delivery address for clients', async () => {
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      const addressInput = screen.getByDisplayValue('123 Main Street, Nairobi');
      fireEvent.change(addressInput, { target: { value: '' } });
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Delivery address is required')).toBeInTheDocument();
      });
    });

    it('validates password strength when changing password', async () => {
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      const changePasswordButton = screen.getByText('Change Password');
      fireEvent.click(changePasswordButton);
      
      const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
      const newPasswordInput = screen.getByPlaceholderText('Enter new password');
      
      fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword' } });
      fireEvent.change(newPasswordInput, { target: { value: 'weak' } });
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Password must contain at least one uppercase letter/)).toBeInTheDocument();
      });
    });

    it('validates password confirmation', async () => {
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      const changePasswordButton = screen.getByText('Change Password');
      fireEvent.click(changePasswordButton);
      
      const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
      const newPasswordInput = screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
      
      fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword' } });
      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123' } });
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls updateProfile with correct data on save', async () => {
      mockAuthContext.updateProfile.mockResolvedValue({ success: true, user: mockAuthContext.user });
      
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockAuthContext.updateProfile).toHaveBeenCalledWith({
          name: 'Jane Doe',
          email: 'john@example.com',
          phone: '+254712345678',
          deliveryAddress: '123 Main Street, Nairobi'
        });
      });
    });

    it('includes password in update when changing password', async () => {
      mockAuthContext.updateProfile.mockResolvedValue({ success: true, user: mockAuthContext.user });
      
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      const changePasswordButton = screen.getByText('Change Password');
      fireEvent.click(changePasswordButton);
      
      const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
      const newPasswordInput = screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
      
      fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword' } });
      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockAuthContext.updateProfile).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+254712345678',
          deliveryAddress: '123 Main Street, Nairobi',
          password: 'NewPassword123'
        });
      });
    });

    it('shows success message on successful update', async () => {
      mockAuthContext.updateProfile.mockResolvedValue({ success: true, user: mockAuthContext.user });
      
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Profile updated successfully!');
      });
    });

    it('shows error message on failed update', async () => {
      mockAuthContext.updateProfile.mockResolvedValue({ 
        success: false, 
        message: 'Update failed' 
      });
      
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Update failed');
      });
    });

    it('handles server validation errors', async () => {
      mockAuthContext.updateProfile.mockResolvedValue({ 
        success: false, 
        errors: [{ field: 'email', message: 'Email already exists' }]
      });
      
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });

    it('shows loading state during save', async () => {
      mockAuthContext.updateProfile.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );
      
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderProfile();
      
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number (Optional)')).toBeInTheDocument();
      expect(screen.getByLabelText('Delivery Address')).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      renderProfile();
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('has accessible form controls', () => {
      renderProfile();
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toBeInTheDocument();
      });
    });
  });
});