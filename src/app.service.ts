import {
  ParseFileType,
  PrevalidateType,
  validate,
  ValidateProfileType,
} from '@ban-team/validateur-bal';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  async validateFile(
    file: Buffer,
    profile: string,
  ): Promise<ParseFileType | PrevalidateType | ValidateProfileType> {
    return await validate(file, { profile });
  }
}
