import { Injectable } from '@nestjs/common';
import { CreateStatusFilterDto } from './dto/create-status_filter.dto';
import { UpdateStatusFilterDto } from './dto/update-status_filter.dto';
import { lastValueFrom, Observable } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusFilterEntity } from './entities/status_filter.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StatusFilterService {
  constructor(
    @InjectRepository(StatusFilterEntity)
    private readonly statusFilterRepository: Repository<StatusFilterEntity>,
  ) {}

  async create(createStatusFilterDto: CreateStatusFilterDto) {
    const statusFilterEntity = new StatusFilterEntity();
    Object.assign(
      statusFilterEntity,
      createStatusFilterDto as StatusFilterEntity,
    );

    return await this.statusFilterRepository.save(statusFilterEntity);
  }

  async findAll(): Promise<StatusFilterEntity[]> {
    const statusFilterEntity = await this.statusFilterRepository.find();
    return statusFilterEntity;
  }

  async findOne(id: string) {
    const statusFilter = await this.statusFilterRepository.findOneBy({
      id: id,
    });
    return statusFilter;
  }

  async update(id: string, updateStatusFilterDto: UpdateStatusFilterDto) {
    const statusFilterEntity = await this.statusFilterRepository.findOneBy({
      id: id,
    });
    Object.assign(statusFilterEntity, updateStatusFilterDto);

    return await this.statusFilterRepository.save(statusFilterEntity);
  }

  async remove(id: string) {
    return await this.statusFilterRepository.delete(id);
  }
}
