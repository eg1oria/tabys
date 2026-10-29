import { Module } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { PublicProductsController } from './public-products.controller.js';
import { AdminProductsController } from './admin-products.controller.js';

@Module({
  controllers: [PublicProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
