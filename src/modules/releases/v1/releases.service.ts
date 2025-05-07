import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { JiraCustomFields } from 'src/common/helpers/helpers.custom_fields.enum';
import { HttpService } from '@nestjs/axios';
import { MappingReleaseFieldsService } from './mapping/mapping.release_fields.service';
import { JiraRelease } from './interfaces/jira-release.interface';
import { ReleaseFilter } from './interfaces/jira-release-filters.interface';

@Injectable()
export class ReleaseService {
  constructor(
    private readonly httpService: HttpService,
    private mappingReleaseFields: MappingReleaseFieldsService,
  ) {}

  findOne(releaseId: string): Observable<any> {
    if (!releaseId) {
      return throwError(() => new NotFoundException('Release Id not informed'));
    }
    const jqlQuery = `type = 'Release Tracker' AND fixVersion = ${releaseId}`;
    const body = {
      jql: jqlQuery,
      fields: [
        JiraCustomFields.FixVersions,
        JiraCustomFields.specialNotes,
        JiraCustomFields.ReleaseStatus,
        JiraCustomFields.Attachments,
      ],
    };
    return this.httpService.post('/search', body).pipe(
      map((response) => {
        const issues = response.data.issues;
        if (!issues || issues.length === 0) {
          throw new NotFoundException('No Release found');
        }
        return this.mappingReleaseFields.mapReleaseFields(response.data);
      }),
      catchError((err) => {
        if (err.code === 'ERR_BAD_REQUEST') {
          return throwError(
            () =>
              new BadRequestException(
                `The value '${releaseId}' does not exist for the field 'fixVersion'`,
              ),
          );
        }
        if (err instanceof HttpException) {
          return throwError(() => err);
        }
        return throwError(
          () => new InternalServerErrorException('Unexpected error occured'),
        );
      }),
    );
  }

  findAllReleases(filters: ReleaseFilter): Observable<any> {
    // Create a inicial jql to use the fixed query to retrieve information
    let jqlQuery = "type = 'Release Tracker' AND ReleaseDate is not EMPTY"; //> startOfYear()

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
      maxResults: 7000,
      fields: [
        JiraCustomFields.FixVersions,
        JiraCustomFields.specialNotes,
        JiraCustomFields.ReleaseStatus,
        JiraCustomFields.Attachments,
      ],
    };
    //const releases: Observable<Promise<JiraRelease>>
    return this.httpService.post('/search', body).pipe(
      map((response) => response.data),
      map((data) => this.mappingReleaseFields.mapReleaseFields(data)),
    );
  }
}
