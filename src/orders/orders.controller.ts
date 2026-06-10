import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { OrdersService } from './orders.service';

interface AuthenticatedRequest {
  user: {
    id: number;
    role: string;
  };
}

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles('CUSTOMER', 'ADMIN')
  @ApiOperation({ summary: 'Get list of orders for the customer or all orders for admin' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved orders.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getOrders(@Req() req: AuthenticatedRequest) {
    return this.ordersService.getOrders(req.user.id, req.user.role);
  }

  @Post()
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Checkout and place an order from the cart items' })
  @ApiResponse({ status: 201, description: 'Order successfully created.' })
  @ApiResponse({ status: 400, description: 'Empty cart or insufficient stock.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  checkout(
    @Req() req: AuthenticatedRequest,
    @Headers('authorization') authHeader: string,
  ) {
    return this.ordersService.checkout(req.user.id, authHeader);
  }

  @Post(':id')
  @Roles('CUSTOMER', 'ADMIN')
  @ApiOperation({ summary: 'Get details of a specific order' })
  @ApiParam({ name: 'id', description: 'The ID of the order', type: Number })
  @ApiResponse({ status: 201, description: 'Successfully retrieved order details.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden access to another customer\'s order.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  getOrderDetails(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.ordersService.getOrderDetails(
      orderId,
      req.user.id,
      req.user.role,
    );
  }
}
