import { Module } from '@nestjs/common';
import { ReleaseService } from './release.service';
import { ReleaseController } from './release.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import { MappingReleaseFieldsService } from './mapping/mapping.release_fields.service';
import { TrasformerJirawikiToHtml } from 'src/common/transformers/transformers.jirawiki_to_html.service';
import { EncryptionService } from 'src/common/utils/utils.encryption.service';
import { MappingUpdateFieldsService } from './mapping/mapping.update_fields.service';
import { DisplayRules } from 'src/common/helpers/helper.display_rules';
import { CommonModule } from 'src/common/common.module';

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
    CommonModule,
  ],
  controllers: [ReleaseController],
  providers: [
    ReleaseService,
    ConfigService,
    MappingReleaseFieldsService,
    MappingUpdateFieldsService,
  ],
})
export class ReleasesModule {}
