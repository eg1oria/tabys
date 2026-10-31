import { Module } from '@nestjs/common';
import { Housekeeping } from './housekeeping.service.js';

@Module({ providers: [Housekeeping] })
export class HousekeepingModule {}
