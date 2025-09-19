import { Module } from '@nestjs/common';
import { JiraApiModule } from './modules/jira_api/jira_api.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PostgresConfigLocalService } from './config/postgres.config.local.service';
import { PddocumentModule } from './modules/documents/pddocument/v1/pddocument.module';
import { ReleasesModule } from './modules/release/v1/release.module';
import { FilterFieldsModule } from './modules/filter_fields/v1/filter_fields.module';
import { ProductLineModule } from './modules/product_line/v1/product_line.module';
import { ApplicationAreaModule } from './modules/application_area/v1/application_area.module';
import { StatusFilterModule } from './modules/status_filter/v1/status_filter.module';
import { CommonModule } from './common/common.module';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { OktaAuthGuard } from './common/guards/okta-auth.guard';
import { ScopesGuard } from './common/guards/scopes.guard';
import { OktaAuth2Guard } from './common/guards/okta-auth2.guard';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({}),
    // Inject Jira replica database configuration
    // TypeOrmModule.forRootAsync({
    //   name: 'jiraConnection',
    //   useClass: PostgresConfigJirareplicaService,
    //   inject: [PostgresConfigJirareplicaService],
    // }),
    // Inject local database configuration
    TypeOrmModule.forRootAsync({
      useClass: PostgresConfigLocalService,
      inject: [PostgresConfigLocalService],
    }),
    // Config service
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JiraApiModule,
    PddocumentModule,
    ReleasesModule,
    FilterFieldsModule,
    ProductLineModule,
    ApplicationAreaModule,
    StatusFilterModule,
    // JiraDatabaseModule,

  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: OktaAuth2Guard },
    // { provide: APP_GUARD, useClass: ScopesGuard },
    Reflector,
  ],
})
export class AppModule { }
