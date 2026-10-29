import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, truncateAll, ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { PasswordService } from '../src/auth/password.service.js';

describe('Каталог (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let publishedId: string;
  const base = '/api/v1';

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await truncateAll(prisma);

    await prisma.adminUser.create({
      data: {
        email: ADMIN_EMAIL,
        name: 'E2E',
        role: 'OWNER',
        passwordHash: await app.get(PasswordService).hash(ADMIN_PASSWORD),
      },
    });

    const group = await prisma.facetGroup.create({
      data: { key: 'material', title: 'Материал', sortOrder: 0 },
    });
    const value = await prisma.facetValue.create({
      data: { groupId: group.id, value: 'aisi304', label: 'AISI 304', sortOrder: 0 },
    });

    const published = await prisma.category.create({
      data: {
        slug: 'opublikovannaya',
        title: 'Опубликованная',
        short: 'Опубликованная',
        description: 'Видна публично',
        highlights: ['первый пункт'],
        positionCount: 20,
        status: 'PUBLISHED',
        sortOrder: 0,
        facetValues: { create: [{ facetValueId: value.id }] },
      },
    });
    publishedId = published.id;

    await prisma.product.createMany({
      data: [
        { categoryId: published.id, title: 'Товар 1', status: 'PUBLISHED', sortOrder: 0 },
        { categoryId: published.id, title: 'Черновик', status: 'DRAFT', sortOrder: 1 },
      ],
    });

    await prisma.category.create({
      data: {
        slug: 'chernovik',
        title: 'Черновик',
        short: 'Черновик',
        description: 'Публично не видна',
        status: 'DRAFT',
        sortOrder: 1,
      },
    });

    const res = await request(app.getHttpServer())
      .post(`${base}/auth/login`)
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(200);
    token = res.body.accessToken;
  });

  afterAll(async () => {
    await truncateAll(prisma);
    await app?.close();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('публичный список отдаёт только опубликованное', async () => {
    const res = await request(app.getHttpServer()).get(`${base}/public/categories`).expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].slug).toBe('opublikovannaya');
  });

  it('форма ответа совпадает с типом Category на фронтенде', async () => {
    const res = await request(app.getHttpServer()).get(`${base}/public/categories`).expect(200);
    expect(res.body[0]).toMatchObject({
      slug: 'opublikovannaya',
      title: 'Опубликованная',
      short: 'Опубликованная',
      description: 'Видна публично',
      count: 20,
      material: ['aisi304'],
      highlights: ['первый пункт'],
    });
    // items — названия только опубликованных товаров.
    expect(res.body[0].items).toEqual(['Товар 1']);
  });

  it('count берётся из positionCount, а не из числа товаров', async () => {
    const res = await request(app.getHttpServer()).get(`${base}/public/categories`).expect(200);
    // Витринное 20 против одного опубликованного товара: витрина важнее.
    expect(res.body[0].count).toBe(20);

    await prisma.category.update({
      where: { id: publishedId },
      data: { positionCount: null },
    });
    const fallback = await request(app.getHttpServer())
      .get(`${base}/public/categories`)
      .expect(200);
    expect(fallback.body[0].count).toBe(1);

    await prisma.category.update({
      where: { id: publishedId },
      data: { positionCount: 20 },
    });
  });

  it('публичный ответ не отдаёт админские поля', async () => {
    const res = await request(app.getHttpServer()).get(`${base}/public/categories`).expect(200);
    for (const row of res.body) {
      for (const field of ['id', 'status', 'sortOrder', 'positionCount', 'createdAt', 'updatedAt', 'publishedAt', 'seoTitle']) {
        expect(row, `утечка поля ${field}`).not.toHaveProperty(field);
      }
    }
  });

  it('черновик недоступен и поимённо', async () => {
    await request(app.getHttpServer()).get(`${base}/public/categories/chernovik`).expect(404);
  });

  it('фасеты заменяют хардкод filterGroups', async () => {
    const res = await request(app.getHttpServer()).get(`${base}/public/facets`).expect(200);
    expect(res.body).toEqual([
      {
        key: 'material',
        title: 'Материал',
        singleSelect: false,
        options: [{ value: 'aisi304', label: 'AISI 304' }],
      },
    ]);
  });

  it('слаг генерируется из русского названия', async () => {
    const res = await request(app.getHttpServer())
      .post(`${base}/admin/categories`)
      .set(auth())
      .send({ title: 'Охладители молока', description: 'тест' })
      .expect(201);
    expect(res.body.slug).toBe('ohladiteli-moloka');
    await prisma.category.delete({ where: { id: res.body.id } });
  });

  it('дубль слага отдаёт 409, а не 500', async () => {
    const res = await request(app.getHttpServer())
      .post(`${base}/admin/categories`)
      .set(auth())
      .send({ title: 'Другая', slug: 'opublikovannaya', description: 'тест' })
      .expect(409);
    expect(res.body.requestId).toBeTruthy();
  });

  it('sortBy вне списка не роняет запрос', async () => {
    await request(app.getHttpServer())
      .get(`${base}/admin/categories?sortBy=passwordHash`)
      .set(auth())
      .expect(200);
  });

  it('лишнее поле в теле отвергается', async () => {
    await request(app.getHttpServer())
      .post(`${base}/admin/categories`)
      .set(auth())
      .send({ title: 'Тест полей', description: 'тест', status: 'PUBLISHED' })
      .expect(400);
  });

  it('reorder разбирается как маршрут, а не как :id', async () => {
    await request(app.getHttpServer())
      .patch(`${base}/admin/categories/reorder`)
      .set(auth())
      .send({ items: [{ id: publishedId, sortOrder: 7 }] })
      .expect(204);

    const row = await prisma.category.findUnique({ where: { id: publishedId } });
    expect(row?.sortOrder).toBe(7);
  });

  it('publish/unpublish меняет видимость', async () => {
    await request(app.getHttpServer())
      .patch(`${base}/admin/categories/${publishedId}/unpublish`)
      .set(auth())
      .expect(200);
    let res = await request(app.getHttpServer()).get(`${base}/public/categories`).expect(200);
    expect(res.body).toHaveLength(0);

    await request(app.getHttpServer())
      .patch(`${base}/admin/categories/${publishedId}/publish`)
      .set(auth())
      .expect(200);
    res = await request(app.getHttpServer()).get(`${base}/public/categories`).expect(200);
    expect(res.body).toHaveLength(1);
  });

  it('товары фильтруются по значению фасета', async () => {
    const value = await prisma.facetValue.findFirstOrThrow({ where: { value: 'aisi304' } });
    const product = await prisma.product.findFirstOrThrow({ where: { title: 'Товар 1' } });
    await prisma.productFacetValue.create({
      data: { productId: product.id, facetValueId: value.id },
    });

    const hit = await request(app.getHttpServer())
      .get(`${base}/public/products?facets=aisi304`)
      .expect(200);
    expect(hit.body.meta.total).toBe(1);

    const miss = await request(app.getHttpServer())
      .get(`${base}/public/products?facets=aisi316`)
      .expect(200);
    expect(miss.body.meta.total).toBe(0);
  });
});
