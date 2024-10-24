import { Controller, Get, Query } from '@nestjs/common';
import { ReleaseService } from './releases.service';
import { lastValueFrom } from 'rxjs';

@Controller('releases')
export class ReleaseController {
  constructor(private readonly releaseService: ReleaseService) {}

  @Get()
  async findAll(@Query() filters: any): Promise<any> {
    const releases = this.releaseService.findAllReleases(filters);
    return await lastValueFrom(releases);
  }
}
