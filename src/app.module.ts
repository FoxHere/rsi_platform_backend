import { Module } from '@nestjs/common';
import { JiraApiModule } from './modules/jira_api/jira_api.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PostgresConfigLocalService } from './config/postgres.config.local.service';
import { PddocumentModule } from './modules/documents/pddocument/v1/pddocument.module';
import { ReleasesModule } from './modules/releases/v1/releases.module';

@Module({
  imports: [
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
    // JiraDatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
