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
        { categoryId: published.id, title: 'Товар 1', slug: 'tovar-1', status: 'PUBLISHED', sortOrder: 0 },
        { categoryId: published.id, title: 'Черновик', slug: 'chernovik', status: 'DRAFT', sortOrder: 1 },
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

  it('форма ответа совпадает с типом PublicCategory на фронтенде', async () => {
    const res = await request(app.getHttpServer()).get(`${base}/public/categories`).expect(200);
    expect(res.body[0]).toMatchObject({
      slug: 'opublikovannaya',
      title: 'Опубликованная',
      short: 'Опубликованная',
      description: 'Видна публично',
      count: 20,
      // Фасеты вложены: ключи групп задаёт редактор, в корне они затирали бы поля.
      facets: { material: ['aisi304'] },
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
      // seoTitle/seoDescription — публичные: из них собираются метаданные страницы категории.
      for (const field of ['id', 'status', 'sortOrder', 'positionCount', 'createdAt', 'updatedAt', 'publishedAt', 'imageId']) {
        expect(row, `утечка поля ${field}`).not.toHaveProperty(field);
      }
    }
  });

  it('черновик недоступен и поимённо', async () => {
    await request(app.getHttpServer()).get(`${base}/public/categories/chernovik`).expect(404);
  });

  it('публичный каталог кешируется, админка и ошибки — нет', async () => {
    const server = app.getHttpServer();
    const pub = await request(server).get(`${base}/public/categories`).expect(200);
    expect(pub.headers['cache-control']).toBe('public, max-age=60, stale-while-revalidate=600');

    // Повтор с ETag — 304 без тела: каталог не гоняется по сети заново.
    await request(server)
      .get(`${base}/public/categories`)
      .set('If-None-Match', pub.headers.etag)
      .expect(304);

    const missing = await request(server).get(`${base}/public/categories/chernovik`).expect(404);
    expect(missing.headers['cache-control']).toBe('no-store');

    const admin = await request(server).get(`${base}/admin/categories`).set(auth()).expect(200);
    expect(admin.headers['cache-control']).toBe('no-store');
    const health = await request(server).get(`${base}/health`).expect(200);
    expect(health.headers['cache-control']).toBe('no-store');
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
    expect(hit.body.data[0]).toMatchObject({
      title: 'Товар 1',
      category: { slug: 'opublikovannaya' },
      facets: { material: ['aisi304'] },
    });

    const miss = await request(app.getHttpServer())
      .get(`${base}/public/products?facets=aisi316`)
      .expect(200);
    expect(miss.body.meta.total).toBe(0);
  });

  it('страница товара отдаётся по слагам категории и товара', async () => {
    const res = await request(app.getHttpServer())
      .get(`${base}/public/products/opublikovannaya/tovar-1`)
      .expect(200);
    expect(res.body).toMatchObject({
      slug: 'tovar-1',
      title: 'Товар 1',
      category: { slug: 'opublikovannaya' },
      images: [],
    });
    for (const field of ['id', 'status', 'categoryId', 'imageId', 'sortOrder']) {
      expect(res.body, `утечка поля ${field}`).not.toHaveProperty(field);
    }
  });

  it('черновик товара и товар чужой категории — 404', async () => {
    await request(app.getHttpServer())
      .get(`${base}/public/products/opublikovannaya/chernovik`)
      .expect(404);
    await request(app.getHttpServer())
      .get(`${base}/public/products/chernovik/tovar-1`)
      .expect(404);
  });

  it('товар снятой с публикации категории — 404', async () => {
    await prisma.category.update({ where: { id: publishedId }, data: { status: 'DRAFT' } });
    await request(app.getHttpServer())
      .get(`${base}/public/products/opublikovannaya/tovar-1`)
      .expect(404);
    await prisma.category.update({ where: { id: publishedId }, data: { status: 'PUBLISHED' } });
  });

  it('новый товар получает слаг из названия, стёртый — собирается заново', async () => {
    const created = await request(app.getHttpServer())
      .post(`${base}/admin/products`)
      .set(auth())
      .send({ categoryId: publishedId, title: 'Насос центробежный' })
      .expect(201);
    expect(created.body.slug).toBe('nasos-centrobezhnyy');

    await request(app.getHttpServer())
      .patch(`${base}/admin/products/${created.body.id}`)
      .set(auth())
      .send({ slug: 'ruchnoy' })
      .expect(200);

    const cleared = await request(app.getHttpServer())
      .patch(`${base}/admin/products/${created.body.id}`)
      .set(auth())
      .send({ slug: null })
      .expect(200);
    // Свой старый слаг не считается занятым — получаем его же, без «-2».
    expect(cleared.body.slug).toBe('nasos-centrobezhnyy');

    await prisma.product.delete({ where: { id: created.body.id } });
  });

  it('характеристики возвращаются в том порядке, в каком их задал редактор', async () => {
    // Порядок нарочно не алфавитный и не по длине: объект в jsonb
    // переставил бы ключи именно так.
    const specs = [
      { key: 'Я', value: '1' },
      { key: 'А', value: '2' },
      { key: 'Бв', value: '3' },
    ];
    const created = await request(app.getHttpServer())
      .post(`${base}/admin/products`)
      .set(auth())
      .send({ categoryId: publishedId, title: 'Порядок характеристик', specs })
      .expect(201);

    const page = await request(app.getHttpServer())
      .get(`${base}/public/products/opublikovannaya/${created.body.slug}`)
      .expect(200);
    expect(page.body.specs).toEqual(specs);

    // Перестановка в админке — тоже сохраняется как есть.
    const reordered = [specs[2], specs[0], specs[1]];
    await request(app.getHttpServer())
      .patch(`${base}/admin/products/${created.body.id}`)
      .set(auth())
      .send({ specs: reordered })
      .expect(200);
    const again = await request(app.getHttpServer())
      .get(`${base}/public/products/opublikovannaya/${created.body.slug}`)
      .expect(200);
    expect(again.body.specs).toEqual(reordered);

    // Пустой массив стирает все характеристики.
    await request(app.getHttpServer())
      .patch(`${base}/admin/products/${created.body.id}`)
      .set(auth())
      .send({ specs: [] })
      .expect(200);
    const cleared = await request(app.getHttpServer())
      .get(`${base}/public/products/opublikovannaya/${created.body.slug}`)
      .expect(200);
    expect(cleared.body.specs).toEqual([]);

    await prisma.product.delete({ where: { id: created.body.id } });
  });

  it('повтор названия характеристики и старый формат-объект — 400', async () => {
    await request(app.getHttpServer())
      .post(`${base}/admin/products`)
      .set(auth())
      .send({
        categoryId: publishedId,
        title: 'Дубль характеристики',
        specs: [
          { key: 'Объём', value: '1 000 л' },
          { key: 'Объём', value: '2 000 л' },
        ],
      })
      .expect(400);
    await request(app.getHttpServer())
      .post(`${base}/admin/products`)
      .set(auth())
      .send({ categoryId: publishedId, title: 'Объект', specs: { 'Объём': '1 000 л' } })
      .expect(400);
  });

  it('у товара без характеристик specs — пустой массив, а не null', async () => {
    const res = await request(app.getHttpServer())
      .get(`${base}/public/products/opublikovannaya/tovar-1`)
      .expect(200);
    expect(res.body.specs).toEqual([]);
  });

  it('картинку из галереи товара удалить нельзя, пока её не уберут из галереи', async () => {
    // Файла на диске нет — удаление его и не требует: запись в базе
    // проверяется раньше, а отсутствующий файл только пишет warn в лог.
    const asset = await prisma.mediaAsset.create({
      data: {
        storageKey: 'e2e/gallery-only.jpg',
        originalName: 'gallery-only.jpg',
        mimeType: 'image/jpeg',
        bytes: 1,
      },
    });
    const product = await request(app.getHttpServer())
      .post(`${base}/admin/products`)
      .set(auth())
      .send({ categoryId: publishedId, title: 'Товар с галереей' })
      .expect(201);
    await prisma.productImage.create({
      data: { productId: product.body.id, mediaId: asset.id, sortOrder: 1 },
    });

    const refused = await request(app.getHttpServer())
      .delete(`${base}/admin/media/${asset.id}`)
      .set(auth())
      .expect(400);
    expect(refused.body.message).toMatch(/галереи товаров: 1/);
    expect(await prisma.productImage.count({ where: { mediaId: asset.id } })).toBe(1);

    // И в обход сервиса база не даёт удалить: связь RESTRICT, а не CASCADE.
    await expect(prisma.mediaAsset.delete({ where: { id: asset.id } })).rejects.toMatchObject({
      code: 'P2003',
    });

    await request(app.getHttpServer())
      .patch(`${base}/admin/products/${product.body.id}`)
      .set(auth())
      .send({ imageIds: [] })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`${base}/admin/media/${asset.id}`)
      .set(auth())
      .expect(204);

    await prisma.product.delete({ where: { id: product.body.id } });
  });
});
