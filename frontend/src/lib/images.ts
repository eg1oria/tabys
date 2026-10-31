/**
 * Фотографии, которые уже лежат в /public/images (вёрстка страниц, не каталог).
 * Остальные слоты рендерятся аккуратным плейсхолдером — см. <ImageSlot>.
 * Когда появится новое фото, достаточно положить файл и добавить путь сюда.
 *
 * Картинки каталога сюда не попадают: их адрес приходит из медиатеки
 * абсолютным (PUBLIC_URL бэкенда), и проверять его по списку нечего.
 */
const available = new Set([
  "/images/hero-main.jpg",
  "/images/hero-dark.jpg",
  "/images/welding.jpg",
  "/images/cat-tanks.jpg",
  "/images/cat-pasteurization.jpg",
  "/images/cat-cheese.jpg",
  "/images/cat-coolers.jpg",
  "/images/cat-curd.jpg",
  "/images/cat-vacuum.jpg",
  "/images/cat-cip.jpg",
  "/images/sol-milk.jpg",
  "/images/sol-cheese.jpg",
  "/images/sol-yogurt.jpg",
  "/images/sol-curd.jpg",
  "/images/sol-drinks.jpg",
  "/images/sol-other.jpg",
]);

export function hasImage(src: string | undefined): src is string {
  if (!src) return false;
  return src.startsWith("http://") || src.startsWith("https://") || available.has(src);
}
