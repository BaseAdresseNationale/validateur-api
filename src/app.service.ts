import {
  PrevalidateType,
  validate,
  ValidateProfile,
} from '@ban-team/validateur-bal';
import { validateRow } from '@ban-team/validateur-bal/dist/validate/rows';
import { Injectable } from '@nestjs/common';
import { ValidateRowDTO } from './dto/validate.dto';

@Injectable()
export class AppService {
  async validateFile(
    file: Buffer,
    profile: string,
  ): Promise<PrevalidateType | ValidateProfile> {
    return validate(file, { profile });
  }

  // async validateLine(line: string): Promise<ValidateRowDTO> {
  //   return validateRow(line);
  // }
}
