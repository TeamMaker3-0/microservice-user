// src/users/users.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(createUserDto);
    return await this.userRepository.save(newUser);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  /**
   * Registra un nuevo usuario en la base de datos.
   * @param createUserDto Datos para crear el usuario (email, password, etc.)
   * @returns El usuario creado con la contraseña hasheada.
   */
  async register(createUserDto: CreateUserDto): Promise<User> {
    const { email, run, password } = createUserDto;

    // 1. Verificar si ya existe un usuario con el mismo email o RUN
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { run }],
    });
    if (existingUser) {
      throw new ConflictException(
        'El email o RUN ya está registrado en el sistema',
      );
    }

    // 2. Hashear la contraseña
    const saltRounds = 10; // Ajusta según la seguridad que requieras
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Crear y guardar el usuario
    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const savedUser = await this.userRepository.save(newUser);

    // 4. Si el rol del usuario es "estudiante", crear la encuesta caracterial llamando al microservicio
    if (savedUser.role === 'estudiante' || savedUser.role === 'profesor') {
      // Define las respuestas por defecto. En este ejemplo se envía un objeto vacío.
      const defaultResponses = {};
      try {
        await axios.post(
          'http://localhost:3000/api/surveys/caracterial', // Reemplaza <MICROSERVICE_URL> por la URL real del microservicio
          {
            studentId: savedUser.id,
            responses: defaultResponses,
          },
          // Puedes agregar opciones adicionales si fuera necesario, por ejemplo, headers o manejo de credenciales.
        );
      } catch (error: any) {
        console.error(
          `Error al crear la encuesta caracterial para el usuario ${savedUser.id}:`,
          error.response?.data || error.message,
        );
        // Puedes decidir si deseas lanzar un error para evitar que se guarde el usuario o simplemente registrar el fallo.
      }
    }

    return savedUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Retorna solo los nombres y correos de los usuarios que tienen role = "estudiante".
   */
  async findAllStudents(): Promise<{ name: string; email: string }[]> {
    // SELECT name, email FROM user WHERE role = 'estudiante'
    const students = await this.userRepository.find({
      select: ['id', 'name', 'email', "eneatype"],
      where: { role: 'estudiante' },
    });
    return students;
  }

  /**
   * Retorna solo los nombres y correos de los usuarios que tienen role = "estudiante".
   */
  async findAllTeachers(): Promise<{ name: string; email: string }[]> {
    // SELECT name, email FROM user WHERE role = 'estudiante'
    const teacher = await this.userRepository.find({
      select: ['id', 'name', 'email'],
      where: { role: 'profesor' },
    });
    return teacher;
  }

  // Método para obtener datos de usuarios a partir de una lista de IDs
  async findUsersByIds(ids: string[]): Promise<Partial<User>[]> {
    return await this.userRepository.find({
      where: { id: In(ids) },
      select: ['id', 'name', 'email', 'role', 'eneatype'],
    });
  }

  // Recover
  /**
   * Recupera la contraseña de un usuario usando su email.
   * La nueva contraseña se genera aleatoriamente con 6 caracteres,
   * se hashea y se actualiza en la base de datos, y luego se envía por email.
   * @param email - Email del usuario
   * @returns Un mensaje indicando que la nueva contraseña se envió
   */
  async recoverPassword(email: string): Promise<string> {
    // Buscar el usuario por email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Generar una nueva contraseña aleatoria de 6 caracteres
    const newPasswordPlain = this.generateRandomPassword(6);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPasswordPlain, saltRounds);

    // Actualizar la contraseña en la base de datos
    user.password = hashedPassword;
    await this.userRepository.save(user);

    // Enviar la nueva contraseña por email al usuario
    await this.sendNewPasswordEmail(email, newPasswordPlain);

    return 'Nueva contraseña enviada por correo';
  }

  /**
   * Genera una contraseña aleatoria con la longitud especificada.
   * @param length - Longitud de la contraseña
   * @returns La contraseña generada
   */
  private generateRandomPassword(length: number): string {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }
    return password;
  }

  /**
   * Envía un email con la nueva contraseña al usuario.
   * @param email - Destinatario
   * @param newPassword - Nueva contraseña en texto plano
   */
  private async sendNewPasswordEmail(email: string, newPassword: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM, // Dirección de origen configurada en .env
      to: email,
      subject: 'Recuperación de contraseña',
      text: `Tu nueva contraseña es: ${newPassword}`,
    };

    await transporter.sendMail(mailOptions);
  }
  /**
   * Actualiza la contraseña de un usuario.
   * @param userId - El ID del usuario
   * @param oldPassword - La contraseña actual del usuario
   * @param newPassword - La nueva contraseña a establecer
   */
  async updatePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 1. Verificar la contraseña anterior (opcional)
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new BadRequestException('La contraseña anterior no coincide');
    }

    // 2. Hashear la nueva contraseña
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 3. Guardar la nueva contraseña
    user.password = hashedNewPassword;
    await this.userRepository.save(user);
  }

  /**
   * Envía correos recordatorios a los estudiantes para que completen las encuestas.
   * @param courseName - Nombre del curso.
   * @param emails - Array de correos electrónicos de los estudiantes que aún no han completado las encuestas.
   */
  async sendReminderEmails(courseName: string, emails: string[]) {
    if (!emails || emails.length === 0) {
      console.log('No hay correos para enviar recordatorios.');
      return;
    }

    // Configuración del transporter, similar a la función para enviar nueva contraseña
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Definir las opciones del correo
    const mailOptions = {
      from: process.env.SMTP_FROM, // Dirección de origen configurada en .env
      subject: 'Recordatorio: Completa tu encuesta',
      text: `Estimado usuario,

Te recordamos que aún no has completado las encuestas social y/o caracterial para el curso con nombre: ${courseName}.
Por favor, accede a la plataforma y completa el cuestionario para poder conocer tu perfil y mejorar la formación de equipos.

Gracias por tu colaboración.
Saludos,
El equipo de TeamMaker`,
    };

    try {
      // Puedes enviar el correo a todos los destinatarios en un solo envío:
      await transporter.sendMail({
        ...mailOptions,
        to: emails.join(', '),
      });
      console.log('Recordatorios enviados a:', emails);
    } catch (error) {
      console.error('Error al enviar recordatorios:', error);
      throw error;
    }
  }
}
