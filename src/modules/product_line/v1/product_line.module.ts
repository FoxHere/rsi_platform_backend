import { Module } from '@nestjs/common';
import { ProductLineService } from './product_line.service';
import { ProductLineController } from './product_line.controller';
import { ProductLineEntity } from './entities/product_line.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationAreaEntity } from 'src/modules/application_area/v1/entities/application_area.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductLineEntity, ApplicationAreaEntity]),
  ],
  controllers: [ProductLineController],
  providers: [ProductLineService],
})
export class ProductLineModule {}
