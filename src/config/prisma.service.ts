import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { createPool } from 'mariadb';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const dbUrl = new URL(
      process.env.DATABASE_URL ||
        'mysql://root:@localhost:3306/transactionservice',
    );

    const pool = createPool({
      host: dbUrl.hostname,
      port: Number.parseInt(dbUrl.port, 10) || 3306,
      user: dbUrl.username,
      password: dbUrl.password,
      database: dbUrl.pathname.substring(1),
      connectionLimit: 10,
    });

    const adapter = new PrismaMariaDb(pool as any);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
