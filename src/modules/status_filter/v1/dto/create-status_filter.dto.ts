import { IsNotEmpty, IsString } from 'class-validator';

export class CreateStatusFilterDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
