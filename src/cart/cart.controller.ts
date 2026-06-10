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

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CUSTOMER')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cart items for the logged-in customer' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved cart items.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getCart(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.cartService.getCart(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a product to the cart' })
  @ApiResponse({
    status: 201,
    description: 'Product successfully added to cart.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request / Validation Error.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async addToCart(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCartItemDto,
  ) {
    const userId = req.user.id;
    return this.cartService.addToCart(userId, dto.productId, dto.quantity);
  }

  @Post(':product_id/update')
  @ApiOperation({ summary: 'Update product quantity in the cart' })
  @ApiParam({
    name: 'product_id',
    description: 'The ID of the product in the cart',
    type: Number,
  })
  @ApiResponse({ status: 201, description: 'Quantity successfully updated.' })
  @ApiResponse({ status: 404, description: 'Cart item not found.' })
  async updateQuantity(
    @Req() req: AuthenticatedRequest,
    @Param('product_id', ParseIntPipe) productId: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    const userId = req.user.id;
    return this.cartService.updateQuantity(userId, productId, dto.quantity);
  }

  @Post(':product_id/delete')
  @ApiOperation({ summary: 'Delete a product from the cart' })
  @ApiParam({
    name: 'product_id',
    description: 'The ID of the product to delete',
    type: Number,
  })
  @ApiResponse({
    status: 201,
    description: 'Product successfully deleted from cart.',
  })
  @ApiResponse({ status: 404, description: 'Cart item not found.' })
  async deleteItem(
    @Req() req: AuthenticatedRequest,
    @Param('product_id', ParseIntPipe) productId: number,
  ) {
    const userId = req.user.id;
    return this.cartService.deleteItem(userId, productId);
  }

  @Post('clear')
  @ApiOperation({ summary: 'Clear all items from the cart' })
  @ApiResponse({ status: 201, description: 'Cart successfully cleared.' })
  async clearCart(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.cartService.clearCart(userId);
  }
}
