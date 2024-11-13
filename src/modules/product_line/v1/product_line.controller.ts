import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { ProductLineService } from './product_line.service';
import { CreateProductLineDto } from './dto/create-product_line.dto';
import { UpdateProductLineDto } from './dto/update-product_line.dto';

@Controller({ path: 'product-line', version: '1' })
export class ProductLineController {
  constructor(private readonly productLineService: ProductLineService) {}

  @Post()
  async create(@Body() createProductLineDto: CreateProductLineDto) {
    return await this.productLineService.create(createProductLineDto);
  }

  @Get()
  findAll() {
    return this.productLineService.findAll();
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductLineDto: UpdateProductLineDto,
  ) {
    return this.productLineService.update(id, updateProductLineDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productLineService.remove(+id);
  }
}
