import { PartialType } from '@nestjs/mapped-types';
import { CreateFilterFieldDto } from './create-filter_field.dto';

export class UpdateFilterFieldDto extends PartialType(CreateFilterFieldDto) {}
