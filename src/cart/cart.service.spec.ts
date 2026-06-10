import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CartService', () => {
  let service: CartService;

  const mockPrismaService = {
    cartItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return hydrated cart items', async () => {
      const mockCartItems = [
        {
          id: 1,
          userId: 1,
          productId: 10,
          quantity: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrismaService.cartItem.findMany.mockResolvedValue(mockCartItems);
      mockedAxios.get.mockResolvedValue({
        data: { id: 10, name: 'Espresso', price: 3000, stock: 15 },
      });

      const result = await service.getCart(1);
      expect(result).toHaveLength(1);
      expect(result[0].productId).toBe(10);
      expect(result[0].product).toEqual({
        id: 10,
        name: 'Espresso',
        price: 3000,
        stock: 15,
      });
      expect(mockPrismaService.cartItem.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('should return item with null product if product not found', async () => {
      const mockCartItems = [
        {
          id: 1,
          userId: 1,
          productId: 99,
          quantity: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrismaService.cartItem.findMany.mockResolvedValue(mockCartItems);
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404 },
      });

      const result = await service.getCart(1);
      expect(result[0].product).toBeNull();
    });
  });

  describe('addToCart', () => {
    it('should throw NotFoundException if product does not exist', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404 },
      });

      await expect(service.addToCart(1, 99, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should increment quantity if cart item exists', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { id: 10, name: 'Espresso', price: 3000, stock: 15 },
      });
      mockPrismaService.cartItem.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        productId: 10,
        quantity: 2,
      });
      mockPrismaService.cartItem.update.mockResolvedValue({
        id: 1,
        userId: 1,
        productId: 10,
        quantity: 5,
      });

      await service.addToCart(1, 10, 3);
      expect(mockPrismaService.cartItem.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.cartItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantity: 5 },
      });
    });

    it('should create new cart item if it does not exist', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { id: 10, name: 'Espresso', price: 3000, stock: 15 },
      });
      mockPrismaService.cartItem.findUnique.mockResolvedValue(null);
      mockPrismaService.cartItem.create.mockResolvedValue({
        id: 2,
        userId: 1,
        productId: 10,
        quantity: 3,
      });

      await service.addToCart(1, 10, 3);
      expect(mockPrismaService.cartItem.create).toHaveBeenCalledWith({
        data: { userId: 1, productId: 10, quantity: 3 },
      });
    });
  });
});
