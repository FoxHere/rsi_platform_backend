import { ProductLineEntity } from 'src/modules/product_line/v1/entities/product_line.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ApplicationAreaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', length: 100 })
  name: string;

  @OneToMany(
    () => ProductLineEntity,
    (productLineEntity) => productLineEntity.application_area,
  )
  @JoinTable({
    name: 'product_line_application_area',
    joinColumn: {
      name: 'application_area_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'product_line_id',
      referencedColumnName: 'id',
    },
  })
  product_line: ProductLineEntity[];
}
