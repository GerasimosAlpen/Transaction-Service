import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const dbUrl = new URL(
      process.env.DATABASE_URL || 'mysql://root:@localhost:3306/authservice',
    );

    const poolConfig = {
      host: dbUrl.hostname,
      port: Number.parseInt(dbUrl.port, 10) || 3306,
      user: dbUrl.username || 'root',
      password: dbUrl.password || '',
      database: dbUrl.pathname.substring(1),
      connectionLimit: 10,
    };

    const adapter = new PrismaMariaDb(poolConfig);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
