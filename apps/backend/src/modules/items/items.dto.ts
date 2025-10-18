import { IsString, IsArray, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ItemCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export class CreateItemDto {
  @ApiProperty({ example: 'iPhone 13 Pro' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'iPhone 13 Pro en excellent état, 128GB, couleur bleu' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Electronics' })
  @IsString()
  category: string;

  @ApiProperty({ enum: ItemCondition, example: ItemCondition.EXCELLENT })
  @IsEnum(ItemCondition)
  condition: ItemCondition;

  @ApiProperty({ example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ example: ['smartphone', 'apple', 'iphone'] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}

export class UpdateItemDto {
  @ApiProperty({ example: 'iPhone 13 Pro', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'iPhone 13 Pro en excellent état, 128GB, couleur bleu', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Electronics', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ enum: ItemCondition, example: ItemCondition.EXCELLENT, required: false })
  @IsOptional()
  @IsEnum(ItemCondition)
  condition?: ItemCondition;

  @ApiProperty({ example: ['https://example.com/image1.jpg'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ example: ['smartphone', 'apple'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
