import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import axios from 'axios';

interface ProductDetails {
  id: number;
  name: string;
  price: number;
  stock: number;
  categoryId: number;
}

@Injectable()
export class OrdersService {
  private productServiceUrl =
    process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

  constructor(private prisma: PrismaService) {}

  private async fetchProductDetails(
    productId: number,
  ): Promise<ProductDetails | null> {
    try {
      const response = await axios.get<ProductDetails>(
        `${this.productServiceUrl}/products/${productId}`,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      return null;
    }
  }

  private async reduceProductStock(
    productId: number,
    quantity: number,
    authHeader?: string,
  ): Promise<boolean> {
    try {
      await axios.post(
        `${this.productServiceUrl}/admin/products/${productId}/reduce`,
        { amount: quantity },
        {
          headers: authHeader ? { Authorization: authHeader } : undefined,
        },
      );
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        throw new BadRequestException(
          error.response.data.message || 'Insufficient stock',
        );
      }
      throw new BadRequestException('Failed to reduce product stock');
    }
  }

  async getOrders(userId: number, role: string) {
    if (role === 'ADMIN') {
      return this.prisma.order.findMany({
        orderBy: { created_at: 'desc' },
      });
    } else {
      return this.prisma.order.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      });
    }
  }

  async checkout(userId: number, authHeader?: string) {
    // 1. Retrieve the cart for the user
    const cart = await this.prisma.cart.findFirst({
      where: { user_id: userId },
      include: { cart_items: true },
    });

    if (!cart || cart.cart_items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const validatedItems: {
      productId: number;
      quantity: number;
      price: number;
    }[] = [];

    // 2. Verify inventory
    for (let i = 0; i < cart.cart_items.length; i++) {
      const item = cart.cart_items[i];
      const product = await this.fetchProductDetails(item.product_id);

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.product_id} not found`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product: ${product.name}`,
        );
      }

      validatedItems.push({
        productId: item.product_id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // 3. Decrement inventory in product-service FIRST
    for (let i = 0; i < validatedItems.length; i++) {
      const item = validatedItems[i];
      await this.reduceProductStock(item.productId, item.quantity, authHeader);
    }

    // 4. Create Order and OrderDetails, then clear cart in a transaction
    const order = await this.prisma.$transaction(async (prisma) => {
      const newOrder = await prisma.order.create({
        data: {
          user_id: userId,
        },
      });

      for (let i = 0; i < validatedItems.length; i++) {
        const item = validatedItems[i];
        await prisma.orderDetail.create({
          data: {
            order_id: newOrder.id,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price,
          },
        });
      }

      await prisma.cartItem.deleteMany({
        where: { cart_id: cart.id },
      });

      return newOrder;
    });

    return { message: 'Order processed successfully', order };
  }

  async getOrderDetails(orderId: number, userId: number, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { order_details: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role === 'CUSTOMER' && order.user_id !== userId) {
      throw new ForbiddenException('You are not authorized to view this order');
    }

    // Since the new schema has no status field, we don't update it.
    // If you need status updates, you must add it back to the schema.prisma
    // and run `npx prisma db push` or `migrate dev`

    // Hydrate product details for the items
    const hydratedItems = await Promise.all(
      order.order_details.map(async (item) => {
        const product = await this.fetchProductDetails(item.product_id);
        return {
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          product: product
            ? {
                id: product.id,
                name: product.name,
                price: product.price,
              }
            : null,
        };
      }),
    );

    return {
      ...order,
      order_details: hydratedItems,
    };
  }
}
