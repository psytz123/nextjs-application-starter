import { User, Product, Order, DisasterZone, PickupLocation } from '@/types';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// File paths
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const DISASTER_ZONES_FILE = path.join(DATA_DIR, 'disaster-zones.json');
const PICKUP_LOCATIONS_FILE = path.join(DATA_DIR, 'pickup-locations.json');

// Initialize files with empty arrays if they don't exist
const initializeFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
};

// Initialize all data files
initializeFile(USERS_FILE);
initializeFile(PRODUCTS_FILE);
initializeFile(ORDERS_FILE);
initializeFile(DISASTER_ZONES_FILE);
initializeFile(PICKUP_LOCATIONS_FILE);

// Generic CRUD operations
export class DataStore<T extends { id: string }> {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  private readData(): T[] {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading data from ${this.filePath}:`, error);
      return [];
    }
  }

  private writeData(data: T[]): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing data to ${this.filePath}:`, error);
    }
  }

  findAll(): T[] {
    return this.readData();
  }

  findById(id: string): T | null {
    const data = this.readData();
    return data.find(item => item.id === id) || null;
  }

  findBy(predicate: (item: T) => boolean): T[] {
    const data = this.readData();
    return data.filter(predicate);
  }

  findOne(predicate: (item: T) => boolean): T | null {
    const data = this.readData();
    return data.find(predicate) || null;
  }

  create(item: T): T {
    const data = this.readData();
    data.push(item);
    this.writeData(data);
    return item;
  }

  update(id: string, updates: Partial<T>): T | null {
    const data = this.readData();
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) return null;
    
    data[index] = { ...data[index], ...updates };
    this.writeData(data);
    return data[index];
  }

  delete(id: string): boolean {
    const data = this.readData();
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    data.splice(index, 1);
    this.writeData(data);
    return true;
  }
}

// Data store instances
export const usersStore = new DataStore<User>(USERS_FILE);
export const productsStore = new DataStore<Product>(PRODUCTS_FILE);
export const ordersStore = new DataStore<Order>(ORDERS_FILE);
export const disasterZonesStore = new DataStore<DisasterZone>(DISASTER_ZONES_FILE);
export const pickupLocationsStore = new DataStore<PickupLocation>(PICKUP_LOCATIONS_FILE);

// Utility functions
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

// Initialize with sample data if stores are empty
export const initializeSampleData = () => {
  // Create admin user if no users exist
  if (usersStore.findAll().length === 0) {
    const adminUser: User = {
      id: generateId(),
      email: 'admin@drm.org',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'admin',
      name: 'System Administrator',
      isApproved: true,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    usersStore.create(adminUser);
  }

  // Create sample disaster zone if none exist
  if (disasterZonesStore.findAll().length === 0) {
    const sampleZone: DisasterZone = {
      id: generateId(),
      name: 'Hurricane Recovery Zone - Florida',
      description: 'Areas affected by Hurricane recovery efforts in Florida',
      zipCodes: ['33101', '33102', '33103', '33104', '33105'],
      cities: ['Miami', 'Miami Beach', 'Coral Gables'],
      states: ['FL'],
      isActive: true,
      startDate: getCurrentTimestamp(),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    disasterZonesStore.create(sampleZone);
  }

  // Create sample pickup location if none exist
  if (pickupLocationsStore.findAll().length === 0) {
    const samplePickup: PickupLocation = {
      id: generateId(),
      name: 'Miami Community Center',
      address: '123 Main Street',
      city: 'Miami',
      state: 'FL',
      zipCode: '33101',
      latitude: 25.7617,
      longitude: -80.1918,
      contactPhone: '(305) 555-0123',
      hours: 'Monday-Friday 9AM-5PM, Saturday 10AM-3PM',
      disasterZoneIds: [],
      isActive: true,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    pickupLocationsStore.create(samplePickup);
  }
};
