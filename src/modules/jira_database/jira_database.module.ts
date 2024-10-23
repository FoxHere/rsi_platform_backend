import { Module } from '@nestjs/common';
import { JiraDatabaseService } from './jira_database.service';
import { JiraDatabaseController } from './jira_database.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JiraLocalDatabaseEntity } from './entities/jira_local_database.entity';
import { JiraApiModule } from '../jira_api/jira_api.module';

@Module({
  imports: [TypeOrmModule.forFeature([JiraLocalDatabaseEntity]), JiraApiModule],
  controllers: [JiraDatabaseController],
  providers: [JiraDatabaseService],
})
export class JiraDatabaseModule {}
