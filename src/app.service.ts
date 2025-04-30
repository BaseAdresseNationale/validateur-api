import {
  ParseFileType,
  validate,
  ValidateType,
  autofix,
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

  async autofixFile(file: Buffer): Promise<Buffer> {
    return await autofix(file);
  }
}
