import { Module } from '@nestjs/common';
import { ReleaseService } from './release.service';
import { ReleaseController } from './release.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import { MappingReleaseFieldsService } from './mapping/mapping.release_fields.service';
import { TrasformerJirawikiToHtml } from 'src/common/transformers/transformers.jirawiki_to_html.service';
import { EncryptionService } from 'src/common/utils/utils.encryption.service';
import { MappingUpdateFieldsService } from 'src/modules/documents/pddocument/v1/mapping/mapping.update_fields.service';

@Module({
  imports: [
    // Config to use Jira API
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
  controllers: [ReleaseController],
  providers: [
    ReleaseService,
    ConfigService,
    MappingReleaseFieldsService,
    MappingUpdateFieldsService,
    EncryptionService,
    TrasformerJirawikiToHtml,
  ],
})
export class ReleasesModule {}
