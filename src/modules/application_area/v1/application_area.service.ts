import { Injectable } from '@nestjs/common';
import { CreateApplicationAreaDto } from './dto/create-application_area.dto';
import { UpdateApplicationAreaDto } from './dto/update-application_area.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ApplicationAreaEntity } from './entities/application_area.entity';
import { Repository } from 'typeorm';
import { application } from 'express';

@Injectable()
export class ApplicationAreaService {
  constructor(
    @InjectRepository(ApplicationAreaEntity)
    private readonly applicationAreaEntity: Repository<ApplicationAreaEntity>,
  ) {}

  async create(createApplicationAreaDto: CreateApplicationAreaDto) {
    const applicationArea = new ApplicationAreaEntity();
    Object.assign(
      applicationArea,
      createApplicationAreaDto as ApplicationAreaEntity,
    );
    return await this.applicationAreaEntity.save(applicationArea);
  }

  async findAll() {
    const applicationAreaList = await this.applicationAreaEntity.find();
    return applicationAreaList;
  }

  findOne(id: number) {
    return `This action returns a #${id} applicationArea`;
  }

  update(id: number, updateApplicationAreaDto: UpdateApplicationAreaDto) {
    return `This action updates a #${id} applicationArea`;
  }

  remove(id: number) {
    return `This action removes a #${id} applicationArea`;
  }
}
