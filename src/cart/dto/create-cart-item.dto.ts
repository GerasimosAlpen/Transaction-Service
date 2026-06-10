import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCartItemDto {
  @ApiProperty({
    description: 'The ID of the product to add to the cart',
    example: 5,
  })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({
    description: 'The quantity of the product to add',
    example: 2,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
