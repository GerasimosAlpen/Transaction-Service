import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CartService } from './cart.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

interface AuthenticatedRequest {
  user: {
    id: number;
    role: string;
  };
}

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CUSTOMER')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.cartService.getCart(userId);
  }

  @Post()
  async addToCart(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCartItemDto,
  ) {
    const userId = req.user.id;
    return this.cartService.addToCart(userId, dto.productId, dto.quantity);
  }

  @Post(':product_id/update')
  async updateQuantity(
    @Req() req: AuthenticatedRequest,
    @Param('product_id', ParseIntPipe) productId: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    const userId = req.user.id;
    return this.cartService.updateQuantity(userId, productId, dto.quantity);
  }

  @Post(':product_id/delete')
  async deleteItem(
    @Req() req: AuthenticatedRequest,
    @Param('product_id', ParseIntPipe) productId: number,
  ) {
    const userId = req.user.id;
    return this.cartService.deleteItem(userId, productId);
  }

  @Post('clear')
  async clearCart(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.cartService.clearCart(userId);
  }
}
