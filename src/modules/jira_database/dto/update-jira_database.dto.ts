import { PartialType } from '@nestjs/mapped-types';
import { CreateJiraDatabaseDto } from './create-jira_database.dto';

export class UpdateJiraDatabaseDto extends PartialType(CreateJiraDatabaseDto) {}
