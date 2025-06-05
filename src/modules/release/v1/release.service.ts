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
  from,
} from 'rxjs';
import { JiraCustomFields } from 'src/common/helpers/helpers.custom_fields.enum';
import { HttpService } from '@nestjs/axios';
import { MappingReleaseFieldsService } from './mapping/mapping.release_fields.service';
import { ReleaseFilter } from './interfaces/jira-release-filters.interface';
import { MappingUpdateFieldsService } from './mapping/mapping.update_fields.service';

@Injectable()
export class ReleaseService {
  constructor(
    private readonly httpService: HttpService,
    private mappingUpdatesFields: MappingUpdateFieldsService,
    private mappingReleaseFields: MappingReleaseFieldsService,
  ) {}

  findOne(fixVersion: string, projectKey?: string | null): Observable<any> {
    let jql = `type = 'Release Tracker' AND fixVersion = ${fixVersion}`;
    if (projectKey) jql += ` AND project = '${projectKey}'`;
    const body = {
      jql: jql,
      fields: [
        JiraCustomFields.FixVersions,
        JiraCustomFields.project,
        JiraCustomFields.ReleaseStatus,
        JiraCustomFields.productLine,
        JiraCustomFields.ApplicationArea,
        JiraCustomFields.SPT,
        JiraCustomFields.Country,
        JiraCustomFields.specialNotes,
        JiraCustomFields.roadmapGroup,
        JiraCustomFields.Attachments,
      ],
    };
    return this.httpService.post('/search', body).pipe(
      map((response) => {
        const issues = response.data.issues;
        if (!issues || issues.length === 0) {
          throw new NotFoundException(`No Release found for ${fixVersion}`);
        }

        return response.data;
      }),
      switchMap((data) =>
        from(this.mappingReleaseFields.mapReleaseFields(data)),
      ),
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
    return this.findOne(fixVersion, projectkey).pipe(
      switchMap((releaseData: any) => {
        const finalReleaseData = releaseData.issues[0];
        const finalProjectKey =
          projectkey || finalReleaseData?.projectkey || null;
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
            JiraCustomFields.roadmapGroup,
            JiraCustomFields.Country,
            JiraCustomFields.Attachments,
          ],
        };

        return this.httpService.post('/search', body).pipe(
          map((response) => response.data),
          switchMap((data) => {
            return this.mappingUpdatesFields.mapUpdateFields(data);
          }),
          map((issuesData) => {
            const sortedIssues = sortLegislativeUpdates(issuesData);
            return {
              total: issuesData.length,
              fixVersion: finalReleaseData.fixVersion ?? '',
              projectKey: finalReleaseData.projectKey ?? '',
              productLine: finalReleaseData.productLine ?? '',
              applicationArea: finalReleaseData.applicationArea ?? '',
              releaseStatus: finalReleaseData.releaseStatus ?? '',
              country: finalReleaseData.country ?? '',
              spt: finalReleaseData.spt ?? '',
              specialNotes: finalReleaseData.specialNotes ?? '',
              issues: sortedIssues,
            };
          }),

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

function sortLegislativeUpdates(updates: any[]): any[] {
  /*
  Grouping and Sorting Legislative Updates 
  Initial Requirement:

    Federal (based on field State;Province;Territory = none/blank or "US - Federal")
      Sorted by Roadmap Group field; Legslative Title (Alpha Descending)

    State level (based on field State;Province;Territory is not none/blank or "US - Federal" and Locality = none)
      Sorted by Roadmap Group field, State;Province;Territory (Alpha Descending); Legslative Title (Alpha Descending)

    Local level (based on field State;Province;Territory is not none/blank or "US - Federal" and Locality is not none)
      Sorted by Roadmap Group field, Locality (Alpha Descending); Legslative Title (Alpha Descending)

  Note: it is assumed (for now) all product lines/countries will be able to use the same grouping and sorting. 
  As further requirements are gathered from each project, we may need to amend the above.
  */
  // First define what is the legilation
  const isFederal = (item: any) => !item.spt || item.spt === 'US - Federal';
  const isState = (item: any) =>
    item.spt &&
    item.spt !== 'US - Federal' &&
    (!item.locality || item.locality.trim() === '');
  const isLocal = (item: any) =>
    item.spt &&
    item.spt.trim() !== 'US - Federal' &&
    item.locality &&
    item.locality.trim() !== '';

  // Split legislation to group by
  const federal = updates.filter(isFederal);
  const state = updates.filter(isState);
  const local = updates.filter(isLocal);

  // Determine the alpha descending comparison
  const alphaDesc = (a: string, b: string) =>
    b.toUpperCase().localeCompare(a.toUpperCase());

  const sortFederal = (list: any[]) =>
    [...list].sort((a, b) => {
      return (
        alphaDesc(a.roadmapGroup ?? '', b.roadmapGroup ?? '') ||
        alphaDesc(a.lTitle ?? '', b.lTitle ?? '')
      );
    });

  const sortState = (list: any[]) =>
    [...list].sort((a, b) => {
      return (
        alphaDesc(a.roadmapGroup ?? '', b.roadmapGroup ?? '') ||
        alphaDesc(a.spt ?? '', b.spt ?? '') ||
        alphaDesc(a.lTitle ?? '', b.lTitle ?? '')
      );
    });

  const sortLocal = (list: any[]) =>
    [...list].sort((a, b) => {
      return (
        alphaDesc(a.roadmapGroup ?? '', b.roadmapGroup ?? '') ||
        alphaDesc(a.locality ?? '', b.locality ?? '') ||
        alphaDesc(a.lTitle ?? '', b.lTitle ?? '')
      );
    });

  return [...sortFederal(federal), ...sortState(state), ...sortLocal(local)];
}
