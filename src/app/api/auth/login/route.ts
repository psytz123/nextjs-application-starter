import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import { ApiResponse, AuthUser } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    const token = generateToken(user);

    return NextResponse.json<ApiResponse<{ user: AuthUser; token: string }>>({
      success: true,
      data: { user, token },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
