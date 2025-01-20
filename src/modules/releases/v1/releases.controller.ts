import { Controller, Get, Query } from '@nestjs/common';
import { ReleaseService } from './releases.service';
import { lastValueFrom } from 'rxjs';
import { JiraRelease } from './interfaces/jira-release.interface';
import { ReleaseFilterDto } from './dto/filter-releases.dto';

@Controller({ path: 'releases', version: '1' })
export class ReleaseController {
  constructor(private readonly releaseService: ReleaseService) {}
  @Get()
  async findAll(@Query() filters: ReleaseFilterDto): Promise<JiraRelease> {
    const releases = this.releaseService.findAllReleases(filters);

    return await lastValueFrom(releases);
  }
}
