import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto.js';

/**
 * status здесь намеренно отсутствует: публикация — отдельный маршрут,
 * который пишет publishedAt и аудит, а не поле в общем PATCH.
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
