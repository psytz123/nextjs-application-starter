import { NextRequest, NextResponse } from 'next/server';
import { productsStore, usersStore, generateId, getCurrentTimestamp } from '@/lib/data';
import { requireAuth } from '@/lib/auth';
import { ApiResponse, Product } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const manufacturerId = searchParams.get('manufacturerId');
    const approved = searchParams.get('approved');

    let products = productsStore.findAll();

    // Filter by category
    if (category) {
      products = products.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
    }

    // Filter by manufacturer
    if (manufacturerId) {
      products = products.filter(p => p.manufacturerId === manufacturerId);
    }

    // Filter by approval status
    if (approved !== null) {
      const isApproved = approved === 'true';
      products = products.filter(p => p.isApproved === isApproved);
    }

    // For public access, only show approved products
    if (!request.headers.get('authorization')) {
      products = products.filter(p => p.isApproved && p.quantity > 0);
    }

    // Add manufacturer info to products
    const productsWithManufacturer = products.map(product => {
      const manufacturer = usersStore.findById(product.manufacturerId);
      return {
        ...product,
        manufacturerName: manufacturer?.name || 'Unknown Manufacturer'
      };
    });

    return NextResponse.json<ApiResponse<typeof productsWithManufacturer>>({
      success: true,
      data: productsWithManufacturer
    });

  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export const POST = requireAuth(['manufacturer', 'admin'])(async (request: NextRequest) => {
  try {
    const {
      title,
      description,
      price,
      originalPrice,
      quantity,
      category,
      images,
      weight,
      dimensions,
      minOrder,
      maxOrder,
      tags
    } = await request.json();

    if (!title || !description || !price || !quantity || !category) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Title, description, price, quantity, and category are required'
      }, { status: 400 });
    }

    const user = (request as any).user;

    const newProduct: Product = {
      id: generateId(),
      title,
      description,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      quantity: parseInt(quantity),
      manufacturerId: user.role === 'admin' ? request.body?.manufacturerId || user.id : user.id,
      category,
      images: images || [],
      weight: weight ? parseFloat(weight) : undefined,
      dimensions,
      minOrder: minOrder ? parseInt(minOrder) : 1,
      maxOrder: maxOrder ? parseInt(maxOrder) : quantity,
      tags: tags || [],
      isApproved: user.role === 'admin', // Admin products are auto-approved
      madeInUSA: true, // All products must be made in USA
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    const createdProduct = productsStore.create(newProduct);

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      data: createdProduct,
      message: user.role === 'admin' ? 'Product created and approved' : 'Product created and pending approval'
    }, { status: 201 });

  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
});
