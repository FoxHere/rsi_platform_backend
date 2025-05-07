import { Module } from '@nestjs/common';
import { JiraApiService } from './jira_api.service';
import { JiraApiController } from './jira_api.controller';
import { HttpModule } from '@nestjs/axios';
import * as https from 'https';
import { JiraApiDataMappingService } from './mapping/jira_api.datamapping.service';
import { TrasformerJirawikiToHtml } from '../../common/transformers/transformers.jirawiki_to_html.service';
import { ConfigService } from '@nestjs/config';
import { JiraApiNewCFMappingService } from './mapping/jira_api.newcfmapping.service';
import { EncryptionService } from '../../common/utils/utils.encryption.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      // inject configService
      inject: [ConfigService],
      // use factory to configure httpmodule
      useFactory: async (configService: ConfigService) => ({
        baseURL: await configService.get('BASE_URL_v2'),
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
    TrasformerJirawikiToHtml,
    JiraApiNewCFMappingService,
    ConfigService,
    EncryptionService,
  ],
  exports: [JiraApiService],
})
export class JiraApiModule {}
