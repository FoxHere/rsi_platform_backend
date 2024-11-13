import { PartialType } from '@nestjs/mapped-types';
import { CreateApplicationAreaDto } from './create-application_area.dto';

export class UpdateApplicationAreaDto extends PartialType(CreateApplicationAreaDto) {}
