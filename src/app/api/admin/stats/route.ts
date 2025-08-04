import { NextRequest, NextResponse } from 'next/server';
import { usersStore, productsStore, ordersStore, disasterZonesStore, pickupLocationsStore } from '@/lib/data';
import { requireAuth } from '@/lib/auth';
import { ApiResponse, DashboardStats } from '@/types';

export const GET = requireAuth(['admin'])(async (request: NextRequest) => {
  try {
    const users = usersStore.findAll();
    const products = productsStore.findAll();
    const orders = ordersStore.findAll();
    const disasterZones = disasterZonesStore.findAll();
    const pickupLocations = pickupLocationsStore.findAll();

    const stats: DashboardStats = {
      totalUsers: users.length,
      totalVictims: users.filter(u => u.role === 'victim').length,
      totalManufacturers: users.filter(u => u.role === 'manufacturer').length,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalValue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      activeDisasterZones: disasterZones.filter(z => z.isActive).length,
      activePickupLocations: pickupLocations.filter(l => l.isActive).length,
    };

    return NextResponse.json<ApiResponse<DashboardStats>>({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
});
