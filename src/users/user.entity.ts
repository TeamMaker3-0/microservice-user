// src/users/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 12 })
  run: string; // Puede incluir dígito verificador según el formato

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Campo para almacenar el password hasheado

  @Column()
  role: string; // Ejemplo: 'profesor', 'estudiante', etc.

  @Column()
  eneatype: string; // Puede ser un valor definido o un enum en el futuro
}
