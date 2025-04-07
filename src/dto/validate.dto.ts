import {
  ErrorLevelEnum,
  ErrorLevelType,
  FieldType,
  NotFoundFieldLevelType,
  ParsedValues,
  ParseFileType,
  ProfileErrorType,
  ProfilesValidationType,
  ValidateFileType,
  ValidateRowFullType,
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

export class NotFoundFieldDTO implements NotFoundFieldLevelType {
  @ApiProperty()
  schemaName: string;

  @ApiProperty({ enum: ErrorLevelEnum })
  level?: ErrorLevelEnum;
}

export class ErrorLevelDTO implements ErrorLevelType {
  @ApiProperty()
  code: string;

  @ApiProperty()
  schemaName?: string;

  @ApiProperty({ enum: ErrorLevelEnum })
  level?: ErrorLevelEnum;
}

export class ValidateRowDTO implements ValidateRowFullType {
  @ApiProperty()
  rawValues: Record<string, string>;

  @ApiProperty()
  parsedValues: ParsedValues;

  @ApiProperty()
  additionalValues: Record<string, any>;

  @ApiProperty()
  localizedValues: Record<string, any>;

  @ApiProperty({ type: () => ErrorLevelDTO, isArray: true })
  errors: ErrorLevelDTO[];

  @ApiProperty()
  isValid: boolean;

  @ApiProperty()
  line: number;
}

export class ValidateFileDTO implements ValidateFileType {
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

export class ParseErrorDTO implements ParseError {
  @ApiProperty({ enum: ['Quotes', 'Delimiter', 'FieldMismatch'] })
  type: 'Quotes' | 'Delimiter' | 'FieldMismatch';

  @ApiProperty({
    enum: [
      'MissingQuotes',
      'UndetectableDelimiter',
      'TooFewFields',
      'TooManyFields',
      'InvalidQuotes',
    ],
  })
  code:
    | 'MissingQuotes'
    | 'UndetectableDelimiter'
    | 'TooFewFields'
    | 'TooManyFields'
    | 'InvalidQuotes';

  @ApiProperty()
  message: string;

  @ApiProperty()
  row?: number;

  @ApiProperty()
  index?: number;
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

  @ApiProperty({ type: () => ParseErrorDTO, isArray: true })
  parseErrors: ParseErrorDTO[];

  @ApiProperty()
  parsedRows: Record<string, string>[];
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
  ProfileErrorsDTO,
) {}
