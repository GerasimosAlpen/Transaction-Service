import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './config/prisma.module';
import { CartModule } from './cart/cart.module';
import { PassportModule } from '@nestjs/passport';
import { OrdersModule } from './orders/orders.module';
import { JwtStrategy } from './common/strategies/jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    CartModule,
    OrdersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}
