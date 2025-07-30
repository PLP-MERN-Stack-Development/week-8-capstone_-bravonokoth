# Wireframes Documentation

## Fish Supply & Delivery Platform

### Design Theme
- **Primary Color**: Green (#2E7D32) - Trust, freshness, nature
- **Secondary Color**: Silver (#B0BEC5) - Clean, modern, professional  
- **Accent Color**: Black (#212121) - Sophistication, contrast
- **Typography**: Poppins (modern, friendly)
- **Style**: Modern, lively UI with gradients, rounded corners, hover animations

---

## 1. Home Page

### Hero Section
- **Layout**: Full-width hero with vibrant fish imagery background
- **Content**: 
  - Large heading: "Fresh Fish Delivered to Your Door"
  - Subtitle: "Premium quality tilapia, omena, catfish, and nile perch"
  - CTA button with green gradient and hover scale animation
- **Search Bar**: Animated input with focus effects, magnifying glass icon

### Featured Products Grid
- **Layout**: 3-column responsive grid (1 column on mobile)
- **Cards**: Rounded corners, subtle shadows, hover lift animation
- **Content**: Fish image, type, size range, starting price
- **Animation**: Staggered fade-in on scroll

---

## 2. Products Page

### Filter Section
- **Layout**: Sticky sidebar (desktop) / collapsible top section (mobile)
- **Filters**: 
  - Fish type dropdown with animated chevron
  - Size range slider with green track
  - Price range with dual handles
- **Animation**: Smooth dropdown transitions

### Product Grid
- **Layout**: 4-column responsive grid
- **Cards**: FishCard component with hover scale
- **Loading**: Skeleton placeholders with shimmer effect
- **Pagination**: Numbered buttons with hover states

---

## 3. Cart Page

### Cart Items List
- **Layout**: Vertical list with quantity controls
- **Items**: 
  - Fish image thumbnail
  - Name, size, weight
  - Quantity stepper buttons
  - Price calculation
- **Animation**: Slide-out animation for item removal

### Order Summary
- **Layout**: Sticky right sidebar (desktop) / bottom section (mobile)
- **Content**: Subtotal, delivery fee, total
- **CTA**: Large green "Proceed to Checkout" button with ripple effect

---

## 4. Order Tracking Page

### Order Status Timeline
- **Layout**: Horizontal progress bar with status nodes
- **Statuses**: Pending → Processing → Shipped → Delivered
- **Animation**: Progress bar fills with green gradient
- **Icons**: Heroicons for each status with color transitions

### Order Details Card
- **Layout**: Clean card with order items
- **Content**: Order ID, date, items list, total
- **Real-time**: Socket.io updates with toast notifications

---

## 5. Admin Dashboard

### Navigation Tabs
- **Layout**: Horizontal tabs with active state indicator
- **Tabs**: Inventory, Orders, Users, Analytics
- **Animation**: Smooth tab switching with slide transitions

### Inventory Management
- **Layout**: Data table with action buttons
- **Features**: Add/Edit modal, delete confirmation
- **Forms**: Floating labels, validation states

### Order Management  
- **Layout**: Orders table with status dropdown
- **Features**: Status update with real-time notifications
- **Filters**: Date range, status, customer filters

---

## 6. Login/Signup Pages

### Form Layout
- **Design**: Centered card with subtle shadow
- **Fields**: Floating label inputs with focus animations
- **Validation**: Real-time validation with error animations
- **CTA**: Green gradient button with loading state

### Background
- **Design**: Subtle fish pattern overlay
- **Animation**: Gentle floating animation on form elements

---

## 7. Profile Page

### Profile Information
- **Layout**: Two-column layout (single column on mobile)
- **Sections**: Personal info, delivery address, security
- **Forms**: Inline editing with save/cancel actions
- **Animation**: Smooth field transitions, success toasts

### Order History
- **Layout**: Tabbed interface for different order statuses
- **Cards**: Clean order cards with tracking links
- **Loading**: Progressive loading with infinite scroll

---

## Responsive Breakpoints
- **Mobile**: < 768px (single column, bottom navigation)
- **Tablet**: 768px - 1024px (adjusted grid layouts)
- **Desktop**: > 1024px (full multi-column layouts)

## Animation Library
- **Framer Motion**: Page transitions, component animations
- **CSS Transitions**: Hover states, form interactions
- **Loading States**: Skeleton screens, progress indicators