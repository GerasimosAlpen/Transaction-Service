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

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles('CUSTOMER', 'ADMIN')
  getOrders(@Req() req: AuthenticatedRequest) {
    return this.ordersService.getOrders(req.user.id, req.user.role);
  }

  @Post()
  @Roles('CUSTOMER')
  checkout(
    @Req() req: AuthenticatedRequest,
    @Headers('authorization') authHeader: string,
  ) {
    return this.ordersService.checkout(req.user.id, authHeader);
  }

  @Post(':id')
  @Roles('CUSTOMER', 'ADMIN')
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
