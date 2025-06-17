import { Module } from '@nestjs/common';
import { DisplayRules } from './helpers/helper.display_rules';
import { TrasformerJirawikiToHtml } from './transformers/transformers.jirawiki_to_html.service';
import { EncryptionService } from './utils/utils.encryption.service';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import * as https from 'https';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
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
  providers: [DisplayRules, TrasformerJirawikiToHtml, EncryptionService],
  exports: [DisplayRules, TrasformerJirawikiToHtml, EncryptionService],
})
export class CommonModule {}
