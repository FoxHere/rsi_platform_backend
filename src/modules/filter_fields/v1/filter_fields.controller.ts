import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { FilterFieldsService } from './filter_fields.service';
import { CreateFilterFieldDto } from './dto/create-filter_field.dto';
import { UpdateFilterFieldDto } from './dto/update-filter_field.dto';

@Controller({ path: 'filter-fields', version: '1' })
export class FilterFieldsController {
  constructor(private readonly filterFieldsService: FilterFieldsService) {}

  @Get('application-area')
  findAllApplicationArea(@Query('productLine') productLine: string) {
    return this.filterFieldsService.findAllApplicationArea(productLine);
  }
}
