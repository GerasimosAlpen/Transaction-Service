import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

interface ProductDetails {
  id: number;
  name: string;
  price: number;
  stock: number;
  categoryId: number;
}

@Injectable()
export class CartService {
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

  async getCart(userId: number) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
    });

    const hydratedItems = await Promise.all(
      items.map(async (item) => {
        const product = await this.fetchProductDetails(item.productId);
        return {
          id: item.id,
          userId: item.userId,
          productId: item.productId,
          quantity: item.quantity,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          product: product
            ? {
                id: product.id,
                name: product.name,
                price: product.price,
                stock: product.stock,
              }
            : null,
        };
      }),
    );

    return hydratedItems;
  }

  async addToCart(userId: number, productId: number, quantity: number) {
    // 1. Verify product existence in Product Service
    const product = await this.fetchProductDetails(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2. Check if the item already exists in the cart for this user and product
    const existing = await this.prisma.cartItem.findUnique({
      where: {
        user_product_unique: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      // If it exists, update the quantity (add them together)
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    }

    // Create a new cart item row
    return this.prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity,
      },
    });
  }

  async updateQuantity(userId: number, productId: number, quantity: number) {
    const existing = await this.prisma.cartItem.findUnique({
      where: {
        user_product_unique: {
          userId,
          productId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity },
    });
  }

  async deleteItem(userId: number, productId: number) {
    const existing = await this.prisma.cartItem.findUnique({
      where: {
        user_product_unique: {
          userId,
          productId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: existing.id },
    });

    return { message: 'Cart item deleted successfully' };
  }

  async clearCart(userId: number) {
    await this.prisma.cartItem.deleteMany({
      where: { userId },
    });

    return { message: 'Cart cleared successfully' };
  }
}
