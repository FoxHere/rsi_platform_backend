import { Injectable } from '@nestjs/common';
import { map, Observable, of } from 'rxjs';
import { JiraCustomFields } from 'src/common/helpers/helpers.custom_fields.enum';
import { HttpService } from '@nestjs/axios';
import { MappingReleaseFieldsService } from './mapping/mapping.release_fields.service';
import {
  JiraRelease,
  JiraReleaseUpdate,
} from './interfaces/jira-release.interface';
import { ReleaseFilter } from './interfaces/jira-release-filters.interface';

@Injectable()
export class ReleaseService {
  constructor(
    private readonly httpService: HttpService,
    private mappingReleaseFields: MappingReleaseFieldsService,
  ) {}

  findAllReleases(filters: ReleaseFilter): Observable<JiraRelease> {
    // Create a inicial jql to use the fixed query to retrieve information
    let jqlQuery =
      "type = 'Release Tracker' AND labels = Document AND ReleaseDate > 2024"; //> startOfYear()

    // Apply filters if exists ----------------------------------------------------
    filters.productLine
      ? (jqlQuery += ` AND "Product Line" = "${filters.productLine}"`)
      : jqlQuery;

    filters.applicationArea
      ? (jqlQuery += ` AND "Application Area" = ${filters.applicationArea}`)
      : jqlQuery;
    //-----------------------------------------------------------------------------
    filters.status ? (jqlQuery += ` AND status = ${filters.status}`) : jqlQuery;
    //-----------------------------------------------------------------------------
    filters.dateFrom
      ? (jqlQuery += ` AND ReleaseDate >= ${filters.dateFrom}`)
      : jqlQuery;
    filters.dateTo
      ? (jqlQuery += ` AND ReleaseDate <= ${filters.dateTo}`)
      : jqlQuery;
    //-----------------------------------------------------------------------------

    const body = {
      jql: (jqlQuery += ' ORDER BY ReleaseDate ASC'),
      fields: [JiraCustomFields.FixVersions, JiraCustomFields.ReleaseStatus],
    };
    //const releases: Observable<Promise<JiraRelease>>
    return this.httpService.post('/search', body).pipe(
      map((response) => response.data),
      map((data) => this.mappingReleaseFields.mapReleaseFields(data)),
    );
  }
}
