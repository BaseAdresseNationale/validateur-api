import {
  PrevalidateType,
  validate,
  ValidateProfile,
} from '@ban-team/validateur-bal';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  async validateFile(
    file: Buffer,
    profile: string,
  ): Promise<PrevalidateType | ValidateProfile> {
    return validate(file, { profile });
  }
}
