import { ApiProperty } from '@nestjs/swagger';

export class ReferenceItemDto {
  @ApiProperty({ example: 'Política' })
  name!: string;

  @ApiProperty({ example: 'politica' })
  slug!: string;
}
