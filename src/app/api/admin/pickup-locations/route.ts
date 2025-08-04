import { NextRequest, NextResponse } from 'next/server';
import { pickupLocationsStore, generateId, getCurrentTimestamp } from '@/lib/data';
import { requireAuth } from '@/lib/auth';
import { ApiResponse, PickupLocation } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const locations = pickupLocationsStore.findAll();
    
    // Filter only active locations for non-admin users
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      const activeLocations = locations.filter(loc => loc.isActive);
      return NextResponse.json<ApiResponse<PickupLocation[]>>({
        success: true,
        data: activeLocations
      });
    }

    return NextResponse.json<ApiResponse<PickupLocation[]>>({
      success: true,
      data: locations
    });

  } catch (error) {
    console.error('Get pickup locations error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export const POST = requireAuth(['admin'])(async (request: NextRequest) => {
  try {
    const {
      name,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      contactPhone,
      contactEmail,
      hours,
      disasterZoneIds
    } = await request.json();

    if (!name || !address || !city || !state || !zipCode || !hours) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Name, address, city, state, zipCode, and hours are required'
      }, { status: 400 });
    }

    const newLocation: PickupLocation = {
      id: generateId(),
      name,
      address,
      city,
      state,
      zipCode,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      contactPhone,
      contactEmail,
      hours,
      disasterZoneIds: disasterZoneIds || [],
      isActive: true,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    const createdLocation = pickupLocationsStore.create(newLocation);

    return NextResponse.json<ApiResponse<PickupLocation>>({
      success: true,
      data: createdLocation,
      message: 'Pickup location created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create pickup location error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
});
