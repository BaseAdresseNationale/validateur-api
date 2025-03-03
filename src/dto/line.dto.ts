import { ApiProperty } from '@nestjs/swagger';

export class LineDTO {
  @ApiProperty({ type: String })
  line: string;
}
