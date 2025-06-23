import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ReleaseService } from './release.service';
import { firstValueFrom, lastValueFrom, Observable } from 'rxjs';
import { Release } from './interfaces/release.interface';
import { ReleaseFilterDto } from './dto/filter-releases.dto';
import { ReleaseDetailsDto } from './dto/release-details.dto';
import { FindAttachmentDto } from './dto/find_attachment.dto';
import { Response } from 'express';

@Controller({ path: 'releases', version: '1' })
export class ReleaseController {
  constructor(private readonly releaseService: ReleaseService) {}

  @Get()
  async findAll(@Query() filters: ReleaseFilterDto): Promise<Release> {
    const releases = this.releaseService.findAllReleases(filters);
    return await lastValueFrom(releases);
  }

  @Get('attachment')
  async findOneAttachment(
    @Query() query: FindAttachmentDto,
    @Res() res: Response,
  ): Promise<StreamableFile> {
    const documentStream = await this.releaseService.getDocumentStream(
      query.fileId,
    );
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${query.fileName}"`,
    );
    return new StreamableFile(documentStream.pipe(res));
  }

  @Get(':fixVersion/details')
  findReleaseDetails(
    @Param('fixVersion') fixVersion: string,
    @Query() query: ReleaseDetailsDto,
  ): Promise<any> {
    const releaseDetails = this.releaseService.findReleaseDetails(
      fixVersion,
      query.projectKey,
    );
    return lastValueFrom(releaseDetails);
  }

  @Get(':fixVersion')
  findOne(@Param('fixVersion') fixVersion: string): Promise<Release> {
    const release = this.releaseService.findOne(fixVersion);
    return firstValueFrom(release);
  }
}
