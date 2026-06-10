import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Successfully connected to the database.');
    } catch (error) {
      console.error(
        'Warning: Could not connect to the database at localhost:3306. ' +
        'Please make sure your database server is running. Server boot will continue.',
      );
    }
  }
}
