import { NextRequest, NextResponse } from 'next/server';
import { ordersStore, productsStore, generateId, getCurrentTimestamp } from '@/lib/data';
import { requireAuth } from '@/lib/auth';
import { ApiResponse, Order, OrderItem } from '@/types';

export const GET = requireAuth()(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let orders = ordersStore.findAll();

    // Filter orders based on user role
    if (user.role === 'victim') {
      orders = orders.filter(order => order.userId === user.id);
    } else if (user.role === 'manufacturer') {
      // Manufacturers can see orders that contain their products
      orders = orders.filter(order => 
        order.items.some(item => {
          const product = productsStore.findById(item.productId);
          return product?.manufacturerId === user.id;
        })
      );
    }
    // Admins can see all orders

    // Filter by status if provided
    if (status) {
      orders = orders.filter(order => order.status === status);
    }

    // Sort by creation date (newest first)
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json<ApiResponse<Order[]>>({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
});

export const POST = requireAuth(['victim'])(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    const { items, pickupLocationId, notes } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Items are required'
      }, { status: 400 });
    }

    if (!pickupLocationId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Pickup location is required'
      }, { status: 400 });
    }

    // Validate and process order items
    const orderItems: OrderItem[] = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = productsStore.findById(item.productId);
      
      if (!product) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Product with ID ${item.productId} not found`
        }, { status: 400 });
      }

      if (!product.isApproved) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Product "${product.title}" is not approved for sale`
        }, { status: 400 });
      }

      if (product.quantity < item.quantity) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Insufficient quantity for product "${product.title}". Available: ${product.quantity}, Requested: ${item.quantity}`
        }, { status: 400 });
      }

      const orderItem: OrderItem = {
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        title: product.title
      };

      orderItems.push(orderItem);
      totalAmount += product.price * item.quantity;

      // Update product quantity
      productsStore.update(product.id, {
        quantity: product.quantity - item.quantity,
        updatedAt: getCurrentTimestamp()
      });
    }

    const newOrder: Order = {
      id: generateId(),
      userId: user.id,
      items: orderItems,
      totalAmount,
      status: 'pending',
      pickupLocationId,
      notes,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    const createdOrder = ordersStore.create(newOrder);

    return NextResponse.json<ApiResponse<Order>>({
      success: true,
      data: createdOrder,
      message: 'Order placed successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
});
