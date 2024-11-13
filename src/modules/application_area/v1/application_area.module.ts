import { Module } from '@nestjs/common';
import { ApplicationAreaService } from './application_area.service';
import { ApplicationAreaController } from './application_area.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationAreaEntity } from './entities/application_area.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApplicationAreaEntity])],
  controllers: [ApplicationAreaController],
  providers: [ApplicationAreaService],
})
export class ApplicationAreaModule {}
