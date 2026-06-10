import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
    const cart = await this.prisma.cart.findFirst({
      where: { user_id: userId },
      include: { cart_items: true },
    });

    if (!cart) {
      return [];
    }

    const hydratedItems = await Promise.all(
      cart.cart_items.map(async (item) => {
        const product = await this.fetchProductDetails(item.product_id);
        return {
          id: item.id,
          cart_id: item.cart_id,
          product_id: item.product_id,
          quantity: item.quantity,
          product: product
            ? {
                name: product.name,
                price: product.price,
              }
            : null,
        };
      }),
    );

    return hydratedItems;
  }

  async addToCart(userId: number, productId: number, quantity: number) {
    // 1. Verify product existence and stock in Product Service
    const product = await this.fetchProductDetails(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (quantity > product.stock) {
      throw new BadRequestException(
        'Requested quantity exceeds available stock',
      );
    }

    // 2. Find or create cart
    let cart = await this.prisma.cart.findFirst({
      where: { user_id: userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { user_id: userId },
      });
    }

    // 3. Check if the item already exists in the cart for this user and product
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cart_id: cart.id,
        product_id: productId,
      },
    });

    if (existing) {
      throw new BadRequestException('Product already exists in the cart');
    }

    // Create a new cart item row
    await this.prisma.cartItem.create({
      data: {
        cart_id: cart.id,
        product_id: productId,
        quantity,
      },
    });

    return { message: 'Product added to cart successfully' };
  }

  async updateQuantity(userId: number, productId: number, quantity: number) {
    const cart = await this.prisma.cart.findFirst({
      where: { user_id: userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cart_id: cart.id,
        product_id: productId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Cart item not found');
    }

    // Verify stock before updating
    const product = await this.fetchProductDetails(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (quantity > product.stock) {
      throw new BadRequestException(
        'Requested quantity exceeds available stock',
      );
    }

    await this.prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity },
    });

    return { message: 'Cart item updated successfully' };
  }

  async deleteItem(userId: number, productId: number) {
    const cart = await this.prisma.cart.findFirst({
      where: { user_id: userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cart_id: cart.id,
        product_id: productId,
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
    const cart = await this.prisma.cart.findFirst({
      where: { user_id: userId },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cart_id: cart.id },
      });
    }

    return { message: 'Cart cleared successfully' };
  }
}
