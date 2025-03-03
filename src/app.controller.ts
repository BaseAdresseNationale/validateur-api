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
import {
  ProfilesValidationDTO,
  ValidateProfileDTO,
  ValidateRowDTO,
} from './dto/validate.dto';
import { FileUploadDTO } from './dto/file.dto';
import * as multer from 'multer';
import { LineDTO } from './dto/line.dto';

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

  // @Post('line')
  // @ApiBody({
  //   type: LineDTO,
  // })
  // @ApiResponse({ status: HttpStatus.OK, type: ValidateRowDTO })
  // async validateLine(@Body() { line }: LineDTO, @Res() res: Response) {
  //   const report: ValidateRowDTO = await this.appService.validateLine(line);
  //   res.status(HttpStatus.OK).json(report);
  // }
}
