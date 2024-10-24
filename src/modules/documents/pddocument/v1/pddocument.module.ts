import { Module } from '@nestjs/common';
import { PddocumentService } from './pddocument.service';
import { PddocumentController } from './pddocument.controller';
import { EncryptionService } from 'src/common/utils/utils.encryption.service';
import { MappingUpdateFieldsService } from './mapping/mapping.update_fields.service';
import { TrasformerJirawikiToHtml } from 'src/common/transformers/transformers.jirawiki_to_html.service';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import * as https from 'https';

@Module({
  imports: [
    // Inject ConfigService to get env values
    HttpModule.registerAsync({
      inject: [ConfigService],
      // Use factory to correctly configure httpModule
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
  controllers: [PddocumentController],
  providers: [
    PddocumentService,
    EncryptionService,
    MappingUpdateFieldsService,
    TrasformerJirawikiToHtml,
    ConfigService,
  ],
})
export class PddocumentModule {}
