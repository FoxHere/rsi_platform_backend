import { Type } from 'class-transformer';
import { IsDate, IsISO8601, IsOptional, IsString } from 'class-validator';

export class ReleaseFilterDto {
  @IsOptional()
  @IsString()
  productLine?: string;

  @IsOptional()
  @IsString()
  applicationArea?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @IsOptional()
  @IsISO8601()
  dateTo?: string;

  [key: string]: string | undefined;
}
