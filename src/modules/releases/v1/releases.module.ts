import { Module } from '@nestjs/common';
import { ReleaseService } from './releases.service';
import { ReleaseController } from './releases.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import { MappingReleaseFieldsService } from './mapping/mapping.release_fields.service';

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
  providers: [ReleaseService, ConfigService, MappingReleaseFieldsService],
})
export class ReleasesModule {}
