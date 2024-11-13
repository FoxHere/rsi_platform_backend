import { Module } from '@nestjs/common';
import { FilterFieldsService } from './filter_fields.service';
import { FilterFieldsController } from './filter_fields.controller';

@Module({
  controllers: [FilterFieldsController],
  providers: [FilterFieldsService],
})
export class FilterFieldsModule {}
