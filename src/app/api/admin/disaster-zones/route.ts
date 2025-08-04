import { NextRequest, NextResponse } from 'next/server';
import { disasterZonesStore, generateId, getCurrentTimestamp } from '@/lib/data';
import { requireAuth } from '@/lib/auth';
import { ApiResponse, DisasterZone } from '@/types';

export const GET = requireAuth(['admin'])(async (request: NextRequest) => {
  try {
    const zones = disasterZonesStore.findAll();
    
    return NextResponse.json<ApiResponse<DisasterZone[]>>({
      success: true,
      data: zones
    });

  } catch (error) {
    console.error('Get disaster zones error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
});

export const POST = requireAuth(['admin'])(async (request: NextRequest) => {
  try {
    const {
      name,
      description,
      zipCodes,
      cities,
      states,
      startDate,
      endDate
    } = await request.json();

    if (!name || !description) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Name and description are required'
      }, { status: 400 });
    }

    const newZone: DisasterZone = {
      id: generateId(),
      name,
      description,
      zipCodes: zipCodes || [],
      cities: cities || [],
      states: states || [],
      isActive: true,
      startDate: startDate || getCurrentTimestamp(),
      endDate,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    const createdZone = disasterZonesStore.create(newZone);

    return NextResponse.json<ApiResponse<DisasterZone>>({
      success: true,
      data: createdZone,
      message: 'Disaster zone created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create disaster zone error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
});
