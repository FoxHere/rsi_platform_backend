import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StatusFilterService } from './status_filter.service';
import { CreateStatusFilterDto } from './dto/create-status_filter.dto';
import { UpdateStatusFilterDto } from './dto/update-status_filter.dto';
import { StatusFilterEntity } from './entities/status_filter.entity';

@Controller({ path: 'status-filter', version: '1' })
export class StatusFilterController {
  constructor(private readonly statusFilterService: StatusFilterService) {}

  @Post()
  async create(
    @Body() createStatusFilterDto: CreateStatusFilterDto,
  ): Promise<StatusFilterEntity> {
    return await this.statusFilterService.create(createStatusFilterDto);
  }

  @Get()
  async findAll(): Promise<StatusFilterEntity[]> {
    return await this.statusFilterService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.statusFilterService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStatusFilterDto: UpdateStatusFilterDto,
  ) {
    return await this.statusFilterService.update(id, updateStatusFilterDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.statusFilterService.remove(id);
  }
}
