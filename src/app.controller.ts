import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { omit } from 'lodash';
import { Response } from 'express';
import { ParseFileType, ValidateType } from '@ban-team/validateur-bal';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProfilesValidationDTO, ValidateProfileDTO } from './dto/validate.dto';
import { ValidateFileDTO, AutofixFileDTO } from './dto/file.dto';
import * as multer from 'multer';

@ApiTags('validate')
@Controller()
@ApiExtraModels(ProfilesValidationDTO)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('validate/file')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: ValidateFileDTO,
  })
  @ApiOperation({
    summary: 'Validate File',
    operationId: 'validateFile',
  })
  @ApiResponse({ status: HttpStatus.OK, type: ValidateProfileDTO })
  async validateFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() { profile, withRows }: ValidateFileDTO,
    @Res() res: Response,
  ) {
    const fileBuffer: Buffer = file.buffer;
    const report: ParseFileType | ValidateType =
      await this.appService.validateFile(fileBuffer, profile || '1.3-relax');

    res
      .status(HttpStatus.OK)
      .json(withRows === 'false' ? omit(report, 'rows') : report);
  }

  @Post('autofix/file')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: AutofixFileDTO,
  })
  @ApiOperation({
    summary: 'AutoFix File',
    operationId: 'autoFix',
  })
  async autofixFile(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    const fileBuffer: Buffer = file.buffer;
    const fileAutoFix: Buffer = await this.appService.autofixFile(fileBuffer);

    res
      .attachment(`bal-autofix.csv`)
      .setHeader('Content-Type', 'text/csv')
      .send(fileAutoFix);
  }
}
