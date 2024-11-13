import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';
import { CreateProductLineDto } from 'src/modules/product_line/v1/dto/create-product_line.dto';
import { ProductLineEntity } from 'src/modules/product_line/v1/entities/product_line.entity';

export class CreateApplicationAreaDto {
  @IsString()
  @IsNotEmpty({ message: 'Application Area name can not be null' })
  name: string;

  // product_line: ProductLineEntity;
}
