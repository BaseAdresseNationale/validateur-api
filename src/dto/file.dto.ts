import { ApiProperty } from '@nestjs/swagger';
import { profiles } from '@ban-team/validateur-bal';

export class ValidateFileDTO {
  @ApiProperty({ type: String, format: 'binary', required: true })
  file: any;

  @ApiProperty({
    enum: Object.keys(profiles),
    default: '1.3-relax',
    required: false,
    description: 'Le masque des erreurs appliquer pour les profilErrors',
  })
  profile: string;

  @ApiProperty({
    type: Boolean,
    default: true,
    required: false,
    description: "Renvoie l'enssemble des lignes parsées de la BAL",
  })
  withRows: string;
}

export class AutofixFileDTO {
  @ApiProperty({ type: String, format: 'binary', required: true })
  file: any;
}
