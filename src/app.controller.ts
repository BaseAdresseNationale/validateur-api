import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { PrevalidateType, ValidateProfile } from '@ban-team/validateur-bal';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProfilesValidationDTO, ValidateProfileDTO } from './dto/validate.dto';
import { FileUploadDTO } from './dto/file.dto';
import * as multer from 'multer';

@ApiTags('validate')
@Controller('validate')
@ApiExtraModels(ProfilesValidationDTO)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: FileUploadDTO,
  })
  @ApiResponse({ status: HttpStatus.OK, type: ValidateProfileDTO })
  async validateFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() { profile }: FileUploadDTO,
    @Res() res: Response,
  ) {
    const fileBuffer: Buffer = file.buffer;
    const report: PrevalidateType | ValidateProfile =
      await this.appService.validateFile(fileBuffer, profile || '1.3-relax');

    res.status(HttpStatus.OK).json(report);
  }
}
