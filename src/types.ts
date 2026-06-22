/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
  role: UserRole;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  stock: number;
  images: string[];
  status: 'active' | 'archived';
  createdAt: string;
}

export type OrderStatus = 
  | 'Pending' 
  | 'Confirmed' 
  | 'Processing' 
  | 'Ready For Pickup' 
  | 'Out For Delivery' 
  | 'Delivered' 
  | 'Completed' 
  | 'Cancelled';

export type DeliveryType = 'delivery' | 'pickup' | 'bargain';

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerContact: string;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  lat?: number;
  lng?: number;
  status: OrderStatus;
  totalAmount: number;
  subtotal?: number;
  deliveryFee: number;
  discountAmount?: number;
  promoCode?: string | null;
  previewImage?: string | null;
  itemCount?: number;
  distanceFromStore?: number;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product?: Product; // Populated for UI
}

export interface AdminSettings {
  storeName: string;
  storeAddress: string;
  lat: number;
  lng: number;
  whatsappNumber: string;
  phoneNumber: string;
  businessEmail: string;
  businessHours: string;
}

export interface Conversation {
  id: string;
  userId: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
  userName?: string; // Populated
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  image?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'chat' | 'order' | 'promo';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  createdAt: string;
}

export interface Promo {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  isActive: boolean;
  createdAt: string;
}
