import { PartialType } from '@nestjs/mapped-types';
import { CreateJiraApiDto } from './create-jira_api.dto';

export class UpdateJiraApiDto extends PartialType(CreateJiraApiDto) {}
