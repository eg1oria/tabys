import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

/** Поля multipart приходят строками, поэтому "false"/"0"/"" — это ложь. */
function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'on', 'yes'].includes(value.trim().toLowerCase());
  }
  return false;
}

function digitsOnly(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '') : '';
}

@ValidatorConstraint({ name: 'phoneHasEnoughDigits' })
class PhoneDigits implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return digitsOnly(value).length >= 10;
  }

  defaultMessage(): string {
    return 'Укажите корректный номер телефона';
  }
}

@ValidatorConstraint({ name: 'consentAccepted' })
class ConsentAccepted implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return toBoolean(value);
  }

  defaultMessage(): string {
    return 'Нужно согласие на обработку данных';
  }
}

/** Правила один в один с frontend/src/lib/actions/request.ts. */
export class CreateLeadDto {
  @ApiProperty({ example: 'Дмитрий' })
  @IsString()
  @MinLength(2, { message: 'Укажите ваше имя' })
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @ApiProperty({ example: '+7 (707) 267-12-37' })
  @IsString()
  @MaxLength(50)
  @Validate(PhoneDigits)
  phone!: string;

  @ApiPropertyOptional()
  @IsEmail({}, { message: 'Проверьте адрес электронной почты' })
  @MaxLength(255)
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(5000, { message: 'Сообщение слишком длинное' })
  @IsOptional()
  message?: string;

  @ApiProperty({ description: 'Согласие на обработку персональных данных' })
  @Validate(ConsentAccepted)
  consent!: string | boolean;

  @ApiPropertyOptional({
    description: 'Honeypot: поле скрыто от людей. Заполнено — это бот.',
  })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  companyWebsite?: string;

  @ApiPropertyOptional({
    description: 'Момент показа формы (ms). Отправка быстрее 2 с — скрипт.',
  })
  @IsString()
  @IsOptional()
  renderedAt?: string;

  get phoneDigits(): string {
    return digitsOnly(this.phone);
  }

  get consentGiven(): boolean {
    return toBoolean(this.consent);
  }

  /** true, если заявку почти наверняка отправил скрипт. */
  get looksAutomated(): boolean {
    if (this.companyWebsite && this.companyWebsite.trim() !== '') return true;
    if (!this.renderedAt) return false;
    const shown = Number(this.renderedAt);
    if (!Number.isFinite(shown) || shown <= 0) return false;
    const elapsed = Date.now() - shown;
    return elapsed >= 0 && elapsed < 2000;
  }
}
