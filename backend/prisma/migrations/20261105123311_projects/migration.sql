-- Проекты переезжают из кода сайта в базу: заказчик правит их в админке.
-- Три проекта, что сейчас на сайте, переносим как есть. Фото — те же файлы,
-- что сид положил в медиатеку для категорий; не нашлось — проект без фото,
-- его можно выбрать в админке.

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "year" TEXT NOT NULL DEFAULT '',
    "scope" TEXT[],
    "imageId" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_status_sortOrder_idx" ON "Project"("status", "sortOrder");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Project" ("id", "title", "subtitle", "location", "year", "scope", "imageId", "status", "sortOrder", "updatedAt")
VALUES
    (
        gen_random_uuid()::text,
        'Комплекс оборудования для переработки молока',
        'Алматы, Казахстан',
        'Алматинская область',
        '2024',
        ARRAY['Приёмное отделение и охлаждение', 'Пастеризационно-охладительная установка', 'Резервуары хранения 5 000 л'],
        (SELECT "id" FROM "MediaAsset" WHERE "originalName" = 'cat-tanks.jpg' ORDER BY "createdAt" LIMIT 1),
        'PUBLISHED',
        0,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::text,
        'Сыроварня под ключ',
        'Проектирование, производство, монтаж',
        'Шымкент',
        '2024',
        ARRAY['Сыродельная ванна 1 000 л', 'Пресс-формы и солильный бассейн', 'Монтаж и пусконаладка'],
        (SELECT "id" FROM "MediaAsset" WHERE "originalName" = 'cat-cheese.jpg' ORDER BY "createdAt" LIMIT 1),
        'PUBLISHED',
        1,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::text,
        'Линия пастеризации и розлива',
        'Комплектация производственной линии',
        'Астана',
        '2023',
        ARRAY['ПОУ производительностью 3 000 л/ч', 'СИП станция мойки', 'Обвязка и автоматика'],
        (SELECT "id" FROM "MediaAsset" WHERE "originalName" = 'cat-pasteurization.jpg' ORDER BY "createdAt" LIMIT 1),
        'PUBLISHED',
        2,
        CURRENT_TIMESTAMP
    );
