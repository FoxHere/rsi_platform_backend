import { Module } from '@nestjs/common';
import { JiraApiModule } from './modules/jira_api/jira_api.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresConfigJirareplicaService } from './config/postgres.config.jirareplica.service';
import { ConfigModule } from '@nestjs/config';
import { JiraDatabaseModule } from './modules/jira_database/jira_database.module';
import { PostgresConfigLocalService } from './config/postgres.config.local.service';
import { EncryptionService } from './modules/utils/services/encryption.service';
import { UtilsModule } from './modules/utils/utils.module';

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
    UtilsModule,
    // JiraDatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
