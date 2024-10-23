import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class JiraLocalDatabaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_key' })
  projectKey: string;

  @Column({ name: 'legislative_title' })
  legislativeTitle: string;

  @Column({ name: 'legislative_description' })
  legislativeDescription: string;

  @Column({ name: 'product_line' })
  productLine: string;

  @Column({ name: 'application_area' })
  applicationArea: string;

  @Column({ name: 'country' })
  country: string;

  @Column({ name: 's_p_t' })
  spt: string;

  @Column({ name: 'update_id' })
  updateId: string;

  @Column({ name: 'sources' })
  sources: string;

  @Column({ name: 'business_impact' })
  businessImpact: string;

  @Column({ name: 'system_impact' })
  systemImpact: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: string;
}
