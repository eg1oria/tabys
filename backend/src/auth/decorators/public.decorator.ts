import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Снимает глобальный JwtAuthGuard с маршрута. Гвард включён по умолчанию
 * для всего приложения: забыть закрыть эндпоинт нельзя, можно только
 * осознанно открыть.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
