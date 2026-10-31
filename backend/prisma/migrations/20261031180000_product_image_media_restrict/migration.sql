-- Картинка из галереи товара больше не удаляется каскадом.
--
-- MediaService.remove проверял только обложки категорий и товаров, а связь
-- ProductImage → MediaAsset была ON DELETE CASCADE: фото, стоящее в галерее
-- (но не главным), удалялось без вопросов и молча пропадало у товара.
-- Проверка в сервисе теперь считает и галерею, а RESTRICT держит то же
-- правило на уровне базы — в том числе в гонке «проверили → кто-то добавил
-- в галерею → удалили».

-- DropForeignKey
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_mediaId_fkey";

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
