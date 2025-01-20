import { PartialType } from '@nestjs/mapped-types';
import { CreateStatusFilterDto } from './create-status_filter.dto';

export class UpdateStatusFilterDto extends PartialType(CreateStatusFilterDto) {}
