import { Controller, Get } from '@nestjs/common';
import { JiraDataResult, JiraDatabaseService } from './jira_database.service';

@Controller('jira-database')
export class JiraDatabaseController {
  constructor(private readonly jiraDatabaseService: JiraDatabaseService) {}

  @Get('/syncdata')
  async syncData() {
    return await this.jiraDatabaseService.syncDataJiraAndLocalDatabase();
  }

  @Get()
  async findAll(): Promise<JiraDataResult> {
    return await this.jiraDatabaseService.getJiraData();
  }
}
