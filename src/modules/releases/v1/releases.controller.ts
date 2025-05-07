import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ReleaseService } from './releases.service';
import { firstValueFrom, lastValueFrom, Observable } from 'rxjs';
import {
  JiraRelease,
  JiraReleaseUpdate,
} from './interfaces/jira-release.interface';
import { ReleaseFilterDto } from './dto/filter-releases.dto';
import { release } from 'os';

@Controller({ path: 'releases', version: '1' })
export class ReleaseController {
  constructor(private readonly releaseService: ReleaseService) {}
  @Get()
  async findAll(@Query() filters: ReleaseFilterDto): Promise<JiraRelease> {
    const releases = this.releaseService.findAllReleases(filters);

    return await lastValueFrom(releases);
  }

  @Get(':releaseId')
  findOne(
    @Param('releaseId') releaseId: string,
  ): Observable<JiraRelease | any> {
    return this.releaseService.findOne(releaseId);
  }
}
