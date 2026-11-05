-- Контакты переезжают из кода сайта в базу: заказчик правит их в админке.
-- Строка одна — та, что сейчас на сайте.

-- CreateTable
CREATE TABLE "SiteContacts" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "address" TEXT NOT NULL,
    "addressShort" TEXT NOT NULL,
    "mapUrl" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phones" JSONB NOT NULL,
    "whatsapp" TEXT,
    "telegram" TEXT,
    "instagram" TEXT,
    "youtube" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContacts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SiteContacts" ADD CONSTRAINT "SiteContacts_single_row" CHECK ("id" = 1);

INSERT INTO "SiteContacts" ("id", "address", "addressShort", "mapUrl", "email", "phones", "whatsapp", "telegram", "updatedAt")
VALUES (
    1,
    'ул. Осипенко 35/А, Алматы, Казахстан',
    'ул. Осипенко 35/А',
    'https://2gis.kz/almaty/search/%D0%9E%D1%81%D0%B8%D0%BF%D0%B5%D0%BD%D0%BA%D0%BE%2035%D0%90',
    'pro_service7@mail.ru',
    '[{"label":"Дмитрий","digits":"77072671237"},{"label":"Андрей","digits":"77052862686"},{"label":"Александр","digits":"77067065426"}]',
    'https://wa.me/77072671237',
    'https://t.me/+77072671237',
    CURRENT_TIMESTAMP
);
