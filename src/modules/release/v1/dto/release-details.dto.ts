import { IsOptional, IsString } from 'class-validator';

export class ReleaseDetailsDto {
  @IsString()
  @IsOptional()
  projectKey?: string;
}
