import {
  ParseFileType,
  PrevalidateType,
  validate,
  ValidateProfileType,
} from './lib/index';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  async validateFile(
    file: Buffer,
    profile: string,
  ): Promise<ParseFileType | PrevalidateType | ValidateProfileType> {
    return validate(file, { profile });
  }
}
