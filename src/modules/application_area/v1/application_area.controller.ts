import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApplicationAreaService } from './application_area.service';
import { CreateApplicationAreaDto } from './dto/create-application_area.dto';
import { UpdateApplicationAreaDto } from './dto/update-application_area.dto';

@Controller({ path: 'application-area', version: '1' })
export class ApplicationAreaController {
  constructor(
    private readonly applicationAreaService: ApplicationAreaService,
  ) {}

  @Post()
  create(@Body() createApplicationAreaDto: CreateApplicationAreaDto) {
    return this.applicationAreaService.create(createApplicationAreaDto);
  }

  @Get()
  findAll() {
    return this.applicationAreaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationAreaService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateApplicationAreaDto: UpdateApplicationAreaDto,
  ) {
    return this.applicationAreaService.update(+id, updateApplicationAreaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.applicationAreaService.remove(+id);
  }
}
