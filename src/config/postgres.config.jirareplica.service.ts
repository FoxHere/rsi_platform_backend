/* import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class PostgresConfigJirareplicaService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(
    connectionName?: string,
  ): TypeOrmModuleOptions | Promise<TypeOrmModuleOptions> {
    return {
      type: 'postgres',
      host: this.configService.get<string>('JIRA_R_DB_HOST'),
      port: this.configService.get<number>('JIRA_R_DB_PORT'),
      username: this.configService.get<string>('JIRA_R_DB_USERNAME'),
      password: this.configService.get<string>('JIRA_R_DB_PASSWORD'),
      database: this.configService.get<string>('JIRA_R_DB_NAME'),
      entities: [],
      synchronize: false,
    };
  }
} */
