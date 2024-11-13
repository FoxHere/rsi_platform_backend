import { PartialType } from '@nestjs/mapped-types';
import { CreateProductLineDto } from './create-product_line.dto';

export class UpdateProductLineDto extends PartialType(CreateProductLineDto) {}
