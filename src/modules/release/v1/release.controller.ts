import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReleaseService } from './release.service';
import { firstValueFrom, lastValueFrom, Observable } from 'rxjs';
import { Release } from './interfaces/release.interface';
import { ReleaseFilterDto } from './dto/filter-releases.dto';
import { ReleaseDetailsDto } from './dto/release-details.dto';

@Controller({ path: 'releases', version: '1' })
export class ReleaseController {
  constructor(private readonly releaseService: ReleaseService) {}
  @Get()
  async findAll(@Query() filters: ReleaseFilterDto): Promise<Release> {
    const releases = this.releaseService.findAllReleases(filters);
    return await lastValueFrom(releases);
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
