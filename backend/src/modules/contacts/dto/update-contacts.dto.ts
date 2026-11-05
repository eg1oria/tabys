import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { normalizePhone } from '../../../common/phone/phone.js';

const trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

/** Пустое поле формы приходит как null — это «убрать ссылку». */
const notNull = () =>
  ValidateIf((_: unknown, value: unknown) => value !== null);

const URL_OPTIONS = { protocols: ['http', 'https'], require_protocol: true };

@ValidatorConstraint({ name: 'contactPhone' })
class PhoneNumber implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && normalizePhone(value) !== null;
  }

  defaultMessage(): string {
    return 'phones: номер в формате +7 (700) 000-00-00';
  }
}

export class ContactPhoneDto {
  @ApiProperty({ example: 'Дмитрий', description: 'Подпись к номеру' })
  @trim()
  @IsString()
  @MinLength(1, { message: 'phones: у каждого номера должна быть подпись' })
  @MaxLength(60)
  label!: string;

  @ApiProperty({ example: '+7 (707) 267-12-37' })
  @trim()
  @IsString()
  @MaxLength(50)
  @Validate(PhoneNumber)
  phone!: string;
}

/**
 * Контакты целиком: форма в админке одна, и отправляет все поля сразу.
 * Сообщения начинаются с имени поля — админка раскладывает их по полям.
 * Правила один в один с frontend/src/lib/admin/contacts-actions.ts.
 */
export class UpdateContactsDto {
  @ApiProperty({ example: 'ул. Осипенко 35/А, Алматы, Казахстан' })
  @trim()
  @IsString()
  @MinLength(5, { message: 'address: укажите адрес' })
  @MaxLength(300)
  address!: string;

  @ApiProperty({ example: 'ул. Осипенко 35/А' })
  @trim()
  @IsString()
  @MinLength(3, { message: 'addressShort: укажите короткий адрес' })
  @MaxLength(150)
  addressShort!: string;

  @ApiProperty({ description: 'Ссылка «Построить маршрут»' })
  @trim()
  @IsUrl(URL_OPTIONS, { message: 'mapUrl: нужна полная ссылка, с https://' })
  @MaxLength(1000)
  mapUrl!: string;

  @ApiProperty({ example: 'pro_service7@mail.ru' })
  @trim()
  @IsEmail({}, { message: 'email: это не похоже на адрес почты' })
  @MaxLength(200)
  email!: string;

  @ApiProperty({
    type: [ContactPhoneDto],
    description: 'По порядку; первый — главный, он в шапке',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'phones: нужен хотя бы один номер' })
  @ArrayMaxSize(6, { message: 'phones: не больше шести номеров' })
  @ValidateNested({ each: true })
  @Type(() => ContactPhoneDto)
  phones!: ContactPhoneDto[];

  @ApiPropertyOptional({ nullable: true, example: 'https://wa.me/77072671237' })
  @trim()
  @notNull()
  @IsUrl(URL_OPTIONS, { message: 'whatsapp: нужна полная ссылка, с https://' })
  @MaxLength(500)
  whatsapp!: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'https://t.me/+77072671237' })
  @trim()
  @notNull()
  @IsUrl(URL_OPTIONS, { message: 'telegram: нужна полная ссылка, с https://' })
  @MaxLength(500)
  telegram!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @trim()
  @notNull()
  @IsUrl(URL_OPTIONS, { message: 'instagram: нужна полная ссылка, с https://' })
  @MaxLength(500)
  instagram!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @trim()
  @notNull()
  @IsUrl(URL_OPTIONS, { message: 'youtube: нужна полная ссылка, с https://' })
  @MaxLength(500)
  youtube!: string | null;
}
