import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ProductLineEntity } from '../entities/product_line.entity';
import { Type } from 'class-transformer';
import { CreateApplicationAreaDto } from 'src/modules/application_area/v1/dto/create-application_area.dto';

class ApplicationAreaDTO {
  @IsString()
  @IsNotEmpty()
  application_area_id: string;
}

export class CreateProductLineDto {
  @IsString()
  @IsNotEmpty({ message: 'Name can not be empty' })
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => ApplicationAreaDTO)
  application_area: ApplicationAreaDTO[];
}
