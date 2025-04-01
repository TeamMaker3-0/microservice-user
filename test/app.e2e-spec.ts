import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let createdUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/POST users', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Juan Pérez',
        run: '12345678-9',
        email: 'juan@example.com',
        role: 'estudiante',
        eneatype: 'tipo1'
      })
      .expect(201)
      .then((response) => {
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Juan Pérez');
        createdUserId = response.body.id;
      });
  });

  it('/GET users', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .then((response) => {
        expect(Array.isArray(response.body)).toBe(true);
      });
  });

  it('/GET users/:id', () => {
    return request(app.getHttpServer())
      .get(`/users/${createdUserId}`)
      .expect(200)
      .then((response) => {
        expect(response.body.id).toBe(createdUserId);
        expect(response.body.name).toBe('Juan Pérez');
      });
  });

  it('/PUT users/:id', () => {
    return request(app.getHttpServer())
      .put(`/users/${createdUserId}`)
      .send({
        name: 'Juan Actualizado',
        email: 'juan.actualizado@example.com'
      })
      .expect(200)
      .then((response) => {
        expect(response.body.name).toBe('Juan Actualizado');
        expect(response.body.email).toBe('juan.actualizado@example.com');
      });
  });

  it('/DELETE users/:id', () => {
    return request(app.getHttpServer())
      .delete(`/users/${createdUserId}`)
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
