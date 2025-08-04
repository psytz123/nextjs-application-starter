import { NextRequest, NextResponse } from 'next/server';
import { usersStore, getCurrentTimestamp } from '@/lib/data';
import { requireAuth } from '@/lib/auth';
import { ApiResponse, User } from '@/types';

export const GET = requireAuth(['admin'])(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const approved = searchParams.get('approved');

    let users = usersStore.findAll();

    // Filter by role
    if (role) {
      users = users.filter(u => u.role === role);
    }

    // Filter by approval status
    if (approved !== null) {
      const isApproved = approved === 'true';
      users = users.filter(u => u.isApproved === isApproved);
    }

    // Remove password from response
    const safeUsers = users.map(({ password, ...user }) => user);

    return NextResponse.json<ApiResponse<Omit<User, 'password'>[]>>({
      success: true,
      data: safeUsers
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
});

export const PATCH = requireAuth(['admin'])(async (request: NextRequest) => {
  try {
    const { userId, isApproved } = await request.json();

    if (!userId || typeof isApproved !== 'boolean') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID and approval status are required'
      }, { status: 400 });
    }

    const user = usersStore.findById(userId);
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const updatedUser = usersStore.update(userId, {
      isApproved,
      updatedAt: getCurrentTimestamp()
    });

    if (!updatedUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Failed to update user'
      }, { status: 500 });
    }

    // Remove password from response
    const { password, ...safeUser } = updatedUser;

    return NextResponse.json<ApiResponse<Omit<User, 'password'>>>({
      success: true,
      data: safeUser,
      message: `User ${isApproved ? 'approved' : 'rejected'} successfully`
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
});
