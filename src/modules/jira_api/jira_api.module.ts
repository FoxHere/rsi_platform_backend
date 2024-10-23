import { Module } from '@nestjs/common';
import { JiraApiService } from './jira_api.service';
import { JiraApiController } from './jira_api.controller';
import { HttpModule } from '@nestjs/axios';
import * as https from 'https';
import { JiraApiDataMappingService } from './mapping/jira_api.datamapping.service';
import { JiraConvertToHtml } from './transformers/jira_api.converttohtml.service';
import { LocalWikitextToHtmlConverter } from './transformers/jira_api.localwikitexttohtml.service';
import { ConfigService } from '@nestjs/config';
import { JiraApiNewCFMappingService } from './mapping/jira_api.newcfmapping.service';
import { EncryptionService } from '../utils/services/encryption.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      // inject configService
      inject: [ConfigService],
      // use factory to configure httpmodule
      useFactory: async (configService: ConfigService) => ({
        baseURL: 'https://jiraqa/rest/api/2',
        headers: {
          Authorization: `Bearer ${await configService.get('JIRA_TOKEN')}`,
          Accept: 'application/json',
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      }),
    }),
  ],
  controllers: [JiraApiController],
  providers: [
    JiraApiService,
    JiraApiDataMappingService,
    JiraConvertToHtml,
    LocalWikitextToHtmlConverter,
    JiraApiNewCFMappingService,
    ConfigService,
    EncryptionService,
  ],
  exports: [JiraApiService],
})
export class JiraApiModule {}
