import { Injectable } from '@nestjs/common';
import { CreateFilterFieldDto } from './dto/create-filter_field.dto';
import { UpdateFilterFieldDto } from './dto/update-filter_field.dto';
import { application } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationAreaEntity } from '../../application_area/v1/entities/application_area.entity';

@Injectable()
export class FilterFieldsService {
  findAllApplicationArea(productLine: string) {
    const applicationArea = {
      total: 2,
      ApplicationArea: ['Financial', 'Payroll'],
    };
    return applicationArea;
  }
}
