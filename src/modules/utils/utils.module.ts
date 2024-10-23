import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './services/encryption.service';

@Module({
  imports: [],
  controllers: [],
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class UtilsModule {}
