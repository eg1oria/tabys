-- Разовое повышение цен: «цена от» всех товаров ×1,5, вверх до целой
-- тысячи (1 025 000 → 1 538 000). Товары без цены не трогаем; у товаров
-- «по запросу» число тоже пересчитываем — иначе при снятии галочки на
-- сайт вернулась бы старая цена.
--
-- Админка тут не участвует, поэтому в журнал пишем одну запись сами:
-- в before — старые цены каждого товара, в after — новые. По ней правку
-- можно и проверить, и откатить.

WITH old AS (
    SELECT "id", "priceFrom" AS "price"
    FROM "Product"
    WHERE "priceFrom" IS NOT NULL
),
changed AS (
    UPDATE "Product" AS p
    SET "priceFrom" = CEIL(old."price" * 1.5 / 1000) * 1000,
        "updatedAt" = CURRENT_TIMESTAMP
    FROM old
    WHERE p."id" = old."id"
    RETURNING p."id", p."title", p."sku", old."price" AS "oldPrice", p."priceFrom" AS "newPrice"
)
INSERT INTO "AuditLog" ("id", "action", "entity", "before", "after")
SELECT
    gen_random_uuid()::text,
    'product.priceIncrease',
    'Product',
    jsonb_agg(jsonb_build_object('id', "id", 'title', "title", 'sku', "sku", 'priceFrom', "oldPrice") ORDER BY "title"),
    jsonb_build_object(
        'factor', 1.5,
        'roundTo', 1000,
        'products', jsonb_agg(jsonb_build_object('id', "id", 'title', "title", 'sku', "sku", 'priceFrom', "newPrice") ORDER BY "title")
    )
FROM changed
HAVING count(*) > 0;
