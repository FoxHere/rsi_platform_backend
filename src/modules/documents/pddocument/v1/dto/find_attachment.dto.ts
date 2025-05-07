import { IsNotEmpty, IsString } from 'class-validator';

export class FindAttachmentDto {
  @IsNotEmpty({ message: 'The fileId parameter cannot be null' })
  @IsString()
  fileId: string;

  @IsNotEmpty({ message: 'The fileName parameter cannot be null' })
  @IsString()
  fileName: string;
}
