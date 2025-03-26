import {
  ParseFileType,
  validate,
  ValidateType,
} from '@ban-team/validateur-bal';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  async validateFile(
    file: Buffer,
    profile: string,
  ): Promise<ParseFileType | ValidateType> {
    return await validate(file, { profile });
  }
}
