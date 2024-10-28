import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { PddocumentService } from './pddocument.service';
import { lastValueFrom } from 'rxjs';
import { Response } from 'express';

@Controller({ path: 'pddocument', version: '1' })
export class PddocumentController {
  constructor(private readonly pddocumentService: PddocumentService) {}

  @Get()
  async findOne(@Query('fix_version') fixVersion: string): Promise<any> {
    const pdDocument = this.pddocumentService.buildPdDocuments(fixVersion);
    return await lastValueFrom(pdDocument);
  }

  @Get('attachment')
  async findOneAttachment(
    @Query('fileId') fileId: string,
    @Query('fileName') fileName: string,
    @Res() res: Response,
  ): Promise<StreamableFile> {
    try {
      // Request to service the document stream
      const documentStream =
        await this.pddocumentService.getDocumentStream(fileId);

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      return new StreamableFile(documentStream.pipe(res));
    } catch (error) {
      console.error('Failed to download document', error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Failed to download document');
    }
  }
}
