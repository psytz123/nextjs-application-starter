export interface User {
  id: string;
  email: string;
  password: string;
  role: 'victim' | 'manufacturer' | 'admin';
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  manufacturerId: string;
  category: string;
  images: string[];
  weight?: number;
  dimensions?: string;
  minOrder?: number;
  maxOrder?: number;
  tags: string[];
  isApproved: boolean;
  madeInUSA: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'ready_for_pickup' | 'completed' | 'cancelled';
  pickupLocationId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  title: string;
}

export interface DisasterZone {
  id: string;
  name: string;
  description: string;
  zipCodes: string[];
  cities: string[];
  states: string[];
  isActive: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PickupLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  contactEmail?: string;
  hours: string;
  disasterZoneIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'victim' | 'manufacturer' | 'admin';
  isApproved: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'victim' | 'manufacturer';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalVictims: number;
  totalManufacturers: number;
  totalProducts: number;
  totalOrders: number;
  totalValue: number;
  activeDisasterZones: number;
  activePickupLocations: number;
}
