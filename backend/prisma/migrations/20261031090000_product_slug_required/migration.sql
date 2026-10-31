-- Слаг товара становится обязательным: из него строится адрес страницы
-- /oborudovanie/<категория>/<товар>. Товары из сида заведены без слага,
-- поэтому сначала заполняем пустые.
--
-- Транслитерация — та же карта, что в src/common/slug/transliterate.ts
-- (ц→c, х→h, щ→sch, казахские буквы). Дальше слаги создаёт уже приложение.

-- 1. Корень слага из названия: многобуквенные замены, потом побуквенные
--    (ъ и ь в translate без пары — удаляются), потом всё прочее в дефис.
CREATE TEMP TABLE product_slug_draft AS
SELECT
  id,
  "categoryId",
  "sortOrder",
  COALESCE(
    NULLIF(
      rtrim(
        left(
          trim(BOTH '-' FROM regexp_replace(
            translate(
              replace(replace(replace(replace(replace(replace(replace(
                lower(title),
                'щ', 'sch'), 'ж', 'zh'), 'ч', 'ch'), 'ш', 'sh'),
                'ю', 'yu'), 'я', 'ya'), 'ң', 'ng'),
              'абвгдеёзийклмнопрстуфхцыэәғқөұүһіъь',
              'abvgdeeziyklmnoprstufhcyeagqouuhi'
            ),
            '[^a-z0-9]+', '-', 'g'
          )),
          76
        ),
        '-'
      ),
      ''
    ),
    'item'
  ) AS root
FROM "Product"
WHERE slug IS NULL;

-- 2. Одинаковые названия в одной категории получают -2, -3… по порядку.
UPDATE "Product" p
SET slug = CASE WHEN d.n = 1 THEN d.root ELSE d.root || '-' || d.n END
FROM (
  SELECT
    id,
    root,
    row_number() OVER (PARTITION BY "categoryId", root ORDER BY "sortOrder", id) AS n
  FROM product_slug_draft
) d
WHERE p.id = d.id
  -- Слаг, уже занятый в категории товаром со своим слагом, не трогаем:
  -- его разберёт следующий шаг.
  AND NOT EXISTS (
    SELECT 1 FROM "Product" o
    WHERE o."categoryId" = p."categoryId"
      AND o.slug = CASE WHEN d.n = 1 THEN d.root ELSE d.root || '-' || d.n END
  );

-- 3. Редкий остаток (столкнулись с ручным слагом) — хвост из id, он уникален.
UPDATE "Product" p
SET slug = d.root || '-' || right(replace(d.id, '-', ''), 8)
FROM product_slug_draft d
WHERE p.id = d.id AND p.slug IS NULL;

DROP TABLE product_slug_draft;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;
