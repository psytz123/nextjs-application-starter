import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateToken, checkEligibility } from '@/lib/auth';
import { usersStore, generateId, getCurrentTimestamp } from '@/lib/data';
import { ApiResponse, AuthUser, User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, address, city, state, zipCode, phone } = await request.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Email, password, name, and role are required'
      }, { status: 400 });
    }

    if (!['victim', 'manufacturer'].includes(role)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid role. Must be victim or manufacturer'
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = usersStore.findOne(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User with this email already exists'
      }, { status: 409 });
    }

    // For victims, check eligibility based on zip code
    if (role === 'victim' && zipCode) {
      const isEligible = checkEligibility(zipCode);
      if (!isEligible) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Your location is not currently in an active disaster zone'
        }, { status: 403 });
      }
    }

    const hashedPassword = await hashPassword(password);

    const newUser: User = {
      id: generateId(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      name,
      address,
      city,
      state,
      zipCode,
      phone,
      isApproved: role === 'victim', // Victims are auto-approved, manufacturers need approval
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    const createdUser = usersStore.create(newUser);

    const authUser: AuthUser = {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      role: createdUser.role,
      isApproved: createdUser.isApproved,
    };

    const token = generateToken(authUser);

    return NextResponse.json<ApiResponse<{ user: AuthUser; token: string }>>({
      success: true,
      data: { user: authUser, token },
      message: role === 'manufacturer' 
        ? 'Registration successful. Your account is pending approval.' 
        : 'Registration successful'
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
