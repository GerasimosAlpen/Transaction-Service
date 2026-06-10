import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'The updated quantity for the product in the cart',
    example: 10,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
