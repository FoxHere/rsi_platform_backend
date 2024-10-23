import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { JiraApiService } from './jira_api.service';
import { Response } from 'express';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { createReadStream } from 'fs';

@Controller('pddocuments')
export class JiraApiController {
  constructor(private readonly jiraApiService: JiraApiService) {}

  @Get('customTest')
  async findCustomFields(
    @Query('fix_version') fixVersion: string,
  ): Promise<any> {
    const jiraResult = this.jiraApiService.findNewCustomFieldsTest(fixVersion);
    return await lastValueFrom(jiraResult);
  }

  @Post('attachment')
  async downloadDocumentAttachment(
    @Body() { fielId, fileName },
    @Res() res: Response,
  ) {
    try {
      // Request to service the document stream
      const documentStream =
        await this.jiraApiService.getDocumentStream(fielId);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fielId}.pdf"`,
      );

      documentStream.pipe(res);
    } catch (error) {
      console.error('Failed to download document', error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Failed to download document');
    }
  }

  @Get('attachment')
  async downloadDocumentAttachmentGet(
    @Query('fileId') fileId: string,
    @Query('fileName') fileName: string,
    @Res() res: Response,
  ): Promise<StreamableFile> {
    try {
      // Request to service the document stream
      const documentStream =
        await this.jiraApiService.getDocumentStream(fileId);

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

  @Get('releases')
  async findAllReleases(@Query() query: any): Promise<any> {
    const releases = this.jiraApiService.findAllReleases(query);
    return await lastValueFrom(releases);
  }

  @Get()
  async findAll(): Promise<any> {
    const jiraResult = this.jiraApiService.findAllPdDocument();
    return await lastValueFrom(jiraResult);
  }
}
