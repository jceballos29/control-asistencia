// src/job-positions/entities/job-position.entity.ts
import { Office } from 'src/offices/entities/office.entity'; // Ajusta la ruta
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm';

@Entity({ name: 'job_positions' })
@Unique(['name', 'officeId']) // Nombre debe ser único para una misma oficina
export class JobPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 }) // Suficiente para hex (#RRGGBB) o nombres de color
  color: string;

  // --- Relación con Office ---
  @Column({ type: 'uuid' }) // Columna explícita para FK
  officeId: string;

  @ManyToOne(() => Office, (office) => office.jobPositions, {
    nullable: false, // Un puesto siempre pertenece a una oficina
    onDelete: 'CASCADE', // Si se borra la oficina, se borran sus puestos
  })
  @JoinColumn({ name: 'officeId' })
  office: Office;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  updatedAt: Date | null;
}
