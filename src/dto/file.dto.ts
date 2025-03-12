import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDTO {
  @ApiProperty({ type: String, format: 'binary', required: true })
  file: any;

  @ApiProperty({ type: String, default: '1.3-relax', required: false })
  profile: string;

  @ApiProperty({ type: Boolean, default: true, required: false })
  withRowsParsed: string;
}
