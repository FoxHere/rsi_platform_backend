import { ApplicationAreaEntity } from 'src/modules/application_area/v1/entities/application_area.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ProductLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', length: 100 })
  name: string;

  @ManyToMany(
    () => ApplicationAreaEntity,
    (applicationAreaEntity) => applicationAreaEntity.product_line,
    { cascade: true },
  )
  @JoinTable({ name: 'product_line_application_area' })
  application_area: ApplicationAreaEntity[];
}
