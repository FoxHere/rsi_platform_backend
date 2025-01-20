import { Module } from '@nestjs/common';
import { StatusFilterService } from './status_filter.service';
import { StatusFilterController } from './status_filter.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusFilterEntity } from './entities/status_filter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StatusFilterEntity])],
  controllers: [StatusFilterController],
  providers: [StatusFilterService],
})
export class StatusFilterModule {}
