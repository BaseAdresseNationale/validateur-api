import {
  ErrorLevelEnum,
  FieldType,
  NotFoundFieldType,
  ParseFileType,
  ProfileErrorType,
  ProfilesValidationType,
  ValidateFile,
  ValidateRowType,
} from '@ban-team/validateur-bal';
import { ApiProperty, getSchemaPath, IntersectionType } from '@nestjs/swagger';
import { ParseError } from 'papaparse';

export class FieldDTO implements FieldType {
  @ApiProperty()
  name: string;

  @ApiProperty()
  schemaName?: string;

  @ApiProperty()
  localizedSchemaName?: string;

  @ApiProperty()
  locale?: string;
}

export class NotFoundFieldDTO implements NotFoundFieldType {
  @ApiProperty()
  schemaName: string;

  @ApiProperty()
  level?: string;
}

export class ValidateRowDTO implements ValidateRowType {
  @ApiProperty()
  rawValues: Record<string, string>;

  @ApiProperty()
  parsedValues: Record<string, string | string[] | boolean | number>;

  @ApiProperty()
  additionalValues: Record<string, any>;

  @ApiProperty()
  localizedValues: Record<string, any>;

  @ApiProperty()
  errors?: {
    code: string;
    schemaName?: string;
    level?: ErrorLevelEnum;
  }[];

  @ApiProperty()
  isValid?: boolean;

  @ApiProperty()
  line?: number;
}

export class ValidateFileDTO implements ValidateFile {
  @ApiProperty()
  encoding: {
    value: string;
    isValid: boolean;
  };

  @ApiProperty()
  delimiter: {
    value: string;
    isValid: boolean;
  };

  @ApiProperty()
  linebreak: {
    value: string;
    isValid: boolean;
  };
}

export class ProfilesValidationDTO implements ProfilesValidationType {
  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isValid: boolean;
}

export class ParseFileDTO implements ParseFileType {
  @ApiProperty()
  encoding: string;

  @ApiProperty()
  linebreak: string;

  @ApiProperty()
  delimiter: string;

  @ApiProperty()
  originalFields: string[];

  @ApiProperty()
  parseOk: boolean;

  @ApiProperty()
  parseErrors: ParseError[];

  @ApiProperty()
  parsedRows?: Record<string, string>[];
}

export class PostParseDTO {
  @ApiProperty({ type: () => FieldDTO, isArray: true })
  fields?: FieldDTO[];

  @ApiProperty({ type: () => NotFoundFieldDTO, isArray: true })
  notFoundFields?: NotFoundFieldDTO[];

  @ApiProperty({ type: () => ValidateRowDTO, isArray: true })
  rows?: ValidateRowDTO[];

  @ApiProperty({ type: () => ValidateFileDTO })
  fileValidation?: ValidateFileDTO;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      $ref: getSchemaPath(ProfilesValidationDTO),
    },
  })
  profilesValidation?: Record<string, ProfilesValidationDTO>;

  @ApiProperty()
  globalErrors?: string[];

  @ApiProperty()
  rowsErrors?: string[];

  @ApiProperty()
  uniqueErrors?: string[];
}

export class ProfileErrorDTO implements ProfileErrorType {
  @ApiProperty()
  code: string;

  @ApiProperty({ enum: ErrorLevelEnum })
  level: ErrorLevelEnum;
}

export class ProfileErrorsDTO {
  @ApiProperty({ type: () => ProfileErrorDTO, isArray: true })
  profilErrors: ProfileErrorDTO[];
}

export class PrevalidateDTO extends IntersectionType(
  ParseFileDTO,
  PostParseDTO,
) {}

export class ValidateProfileDTO extends IntersectionType(
  PrevalidateDTO,
  ProfileErrorDTO,
) {}
