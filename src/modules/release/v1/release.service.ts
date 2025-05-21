import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  catchError,
  map,
  Observable,
  of,
  throwError,
  switchMap,
  forkJoin,
} from 'rxjs';
import { JiraCustomFields } from 'src/common/helpers/helpers.custom_fields.enum';
import { HttpService } from '@nestjs/axios';
import { MappingReleaseFieldsService } from './mapping/mapping.release_fields.service';
import { ReleaseFilter } from './interfaces/jira-release-filters.interface';
import { ReleaseDetailsDto } from './dto/release-details.dto';
import { MappingUpdateFieldsService } from 'src/modules/documents/pddocument/v1/mapping/mapping.update_fields.service';

@Injectable()
export class ReleaseService {
  constructor(
    private readonly httpService: HttpService,
    private mappingUpdatesFields: MappingUpdateFieldsService,
    private mappingReleaseFields: MappingReleaseFieldsService,
  ) {}

  findOne(fixVersion: string): Observable<any> {
    const body = {
      jql: `type = 'Release Tracker' AND fixVersion = ${fixVersion}`,
      fields: [
        JiraCustomFields.specialNotes,
        JiraCustomFields.FixVersions,
        JiraCustomFields.project,
        JiraCustomFields.ReleaseStatus,
        JiraCustomFields.ApplicationArea,
        JiraCustomFields.productLine,
        JiraCustomFields.SPT,
        JiraCustomFields.Country,
        JiraCustomFields.Attachments,
      ],
    };
    return this.httpService.post('/search', body).pipe(
      map((response) => {
        const issues = response.data.issues;
        if (!issues || issues.length === 0) {
          throw new NotFoundException(`No Release found for ${fixVersion}`);
        }
        return this.mappingReleaseFields.mapReleaseFields(response.data);
      }),
      catchError((err) => {
        if (err.code === 'ERR_BAD_REQUEST') {
          return throwError(
            () =>
              new BadRequestException(
                `The value '${fixVersion}' does not exist for the field 'fixVersion'`,
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

  findReleaseDetails(
    fixVersion: string,
    projectkey?: string | null,
  ): Observable<any> {
    if (fixVersion == null) {
      return throwError(
        () => new BadRequestException(`The value '${fixVersion}' is required`),
      );
    }
    return this.findOne(fixVersion).pipe(
      switchMap((releaseData: any) => {
        const finalProjectKey = projectkey || releaseData?.projectkey || null;
        let jqlQuery = `fixVersion = '${fixVersion}' AND type in (Epic, Story, Documentation) AND "Legislative Title" is not EMPTY AND "Legislative Title" !~ "<None>"`;
        if (finalProjectKey) jqlQuery += ` AND project = '${finalProjectKey}'`;

        const body = {
          jql: jqlQuery,
          maxResults: 7000,
          fields: [
            JiraCustomFields.Key,
            JiraCustomFields.Summary,
            JiraCustomFields.lTitle,
            JiraCustomFields.lSummary,
            JiraCustomFields.lDescription,
            JiraCustomFields.lSourceLinks,
            JiraCustomFields.lBusinessImpact,
            JiraCustomFields.lSystemImpact,
            JiraCustomFields.ConfigurationSteps,
            JiraCustomFields.UserGuide,
            JiraCustomFields.productLine,
            JiraCustomFields.ApplicationArea,
            JiraCustomFields.SPT,
            JiraCustomFields.Country,
            JiraCustomFields.Attachments,
          ],
        };

        return this.httpService.post('/search', body).pipe(
          map((response) => response.data),
          switchMap((data) => {
            return this.mappingUpdatesFields.mapUpdateFields(data);
          }),

          map((issuesData) => ({
            total: issuesData.length,
            specialNotes: releaseData.specialNotes ?? '',
            issues: issuesData,
          })),

          catchError((err) => {
            if (err.code === 'ERR_BAD_REQUEST') {
              return throwError(() => {
                return new BadRequestException(
                  `The value '${fixVersion}' does not exist for the field 'fixVersion'`,
                );
              });
            }
            if (err instanceof HttpException) {
              return throwError(() => err);
            }
            return throwError(
              () => new InternalServerErrorException(err.message),
            );
          }),
        );
      }),
    );
  }

  findAllReleases(filters: ReleaseFilter): Observable<any> {
    // Create inicial jql to use the fixed query to retrieve information
    let jqlQuery = "type = 'Release Tracker' AND ReleaseDate is not EMPTY";
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
        // JiraCustomFields.specialNotes,
        JiraCustomFields.project,
        JiraCustomFields.ReleaseStatus,
        JiraCustomFields.Attachments,
        JiraCustomFields.ApplicationArea,
        JiraCustomFields.productLine,
        JiraCustomFields.SPT,
        JiraCustomFields.Country,
      ],
    };
    //const releases: Observable<Promise<JiraRelease>>
    return this.httpService.post('/search', body).pipe(
      map((response) => response.data),
      map((data) => this.mappingReleaseFields.mapReleaseFields(data, false)),
    );
  }
}
