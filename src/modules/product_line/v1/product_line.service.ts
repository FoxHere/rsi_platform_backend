import { Injectable } from '@nestjs/common';
import { CreateProductLineDto } from './dto/create-product_line.dto';
import { UpdateProductLineDto } from './dto/update-product_line.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductLineEntity } from './entities/product_line.entity';
import { In, Repository } from 'typeorm';
import { ApplicationAreaEntity } from 'src/modules/application_area/v1/entities/application_area.entity';

@Injectable()
export class ProductLineService {
  constructor(
    @InjectRepository(ProductLineEntity)
    private readonly productLineRepository: Repository<ProductLineEntity>,

    @InjectRepository(ApplicationAreaEntity)
    private readonly applicationAreaRepository: Repository<ApplicationAreaEntity>,
  ) {}

  async create(createProductLineDto: CreateProductLineDto) {
    // Bring all Application area ids from DTO
    const applicationAreaItems = createProductLineDto.application_area.map(
      (item) => item.application_area_id,
    );

    const applicationAreaList = await this.applicationAreaRepository.findBy({
      id: In(applicationAreaItems),
    });
    const productLine = new ProductLineEntity();
    productLine.name = createProductLineDto.name;
    productLine.application_area = applicationAreaList;
    return await this.productLineRepository.save(productLine);
  }

  async findAll() {
    const productLineList = await this.productLineRepository.find({
      relations: ['application_area'],
    });
    return productLineList;
  }

  async update(id: string, updateProductLineDto: UpdateProductLineDto) {
    const { application_area, ...productlineProps } = updateProductLineDto;
    const applicationAreaIds = application_area.map(
      (item) => item.application_area_id,
    );

    const productLine = await this.productLineRepository.findOne({
      where: {
        id: id,
      },
      relations: ['application_area'],
    });
    Object.assign(productLine, productlineProps);
    const applicationAreaList = await this.applicationAreaRepository.findBy({
      id: In(applicationAreaIds),
    });

    productLine.application_area = applicationAreaList;
    return await this.productLineRepository.save(productLine);
  }

  remove(id: number) {
    return `This action removes a #${id} productLine`;
  }
}
