import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class PostgresConfigLocalService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(
    connectionName?: string,
  ): TypeOrmModuleOptions | Promise<TypeOrmModuleOptions> {
    return {
      type: 'postgres',
      host: this.configService.get<string>('LOCAL_DB_HOST'),
      port: this.configService.get<number>('LOCAL_DB_PORT'),
      username: this.configService.get<string>('LOCAL_DB_USERNAME'),
      password: this.configService.get<string>('LOCAL_DB_PASSWORD'),
      database: this.configService.get<string>('LOCAL_DB_NAME'),
      entities: [__dirname + '/../**/**/**/*.entity{.js,.ts}'],
      synchronize: true,
    };
  }
}
