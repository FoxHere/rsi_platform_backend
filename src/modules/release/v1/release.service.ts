import {
  BadRequestException,
  HttpException,
  HttpStatus,
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
  lastValueFrom,
} from 'rxjs';
import { JiraCustomFields } from 'src/common/helpers/helpers.custom_fields.enum';
import { HttpService } from '@nestjs/axios';
import { MappingReleaseFieldsService } from './mapping/mapping.release_fields.service';
import { ReleaseFilter } from './interfaces/release_filters.interface';
import { MappingUpdateFieldsService } from './mapping/mapping.update_fields.service';
import { Release } from './interfaces/release.interface';
import { EncryptionService } from 'src/common/utils/utils.encryption.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReleaseService {
  constructor(
    private readonly httpService: HttpService,
    private mappingUpdatesFields: MappingUpdateFieldsService,
    private mappingReleaseFields: MappingReleaseFieldsService,
    private encryptionService: EncryptionService,
    private readonly configServices: ConfigService,
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
        JiraCustomFields.specialNotesStatus,
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
            JiraCustomFields.lAttachments,
            JiraCustomFields.ConfigurationSteps,
            JiraCustomFields.UserGuide,
            JiraCustomFields.productLine,
            JiraCustomFields.ApplicationArea,
            JiraCustomFields.SPT,
            JiraCustomFields.Locality,
            JiraCustomFields.roadmapGroup,
            JiraCustomFields.objectAffected,
            JiraCustomFields.Country,
            JiraCustomFields.configStepsStatus,
            JiraCustomFields.userGuideStatus,
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
            // const sortedIssues = groupAndSortLegislativeUpdates2(issuesData);
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
              installInstructions: '',
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

  findAllReleases(filters: ReleaseFilter): Observable<Promise<Release>> {
    // Create inicial jql to use the fixed query to retrieve information
    let jqlQuery: string = `type = "Release Tracker" AND fixVersion not in archivedVersions() AND fixVersion is not EMPTY`;
    // let jqlQuery: string = `type = 'Release Tracker' AND fixVersion is not EMPTY AND 'Release Status' !~ 'ARCHIVED'`;
    // Apply filters if exists ----------------------------------------------------
    filters.productLine
      ? (jqlQuery += ` AND "Product Line" = "${filters.productLine}"`)
      : jqlQuery;

    filters.applicationArea
      ? (jqlQuery += ` AND "Application Area" = ${filters.applicationArea}`)
      : jqlQuery;
    //-----------------------------------------------------------------------------
    if (filters.status) {
      const statusFilter = (status: string): string => {
        switch (status) {
          case 'planned':
            return 'Planned';
          case 'preDelivery':
            return 'Pre-Delivery';
          case 'inProgress':
            return 'In Progress';
          case 'delivered':
            return 'Delivered';
        }
      };
      const parsedStatus = statusFilter(filters.status);
      //-----------------------------------------------------------------------------
      filters.status
        ? (jqlQuery += ` AND status = '${parsedStatus}'`)
        : jqlQuery;
    }
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
    return this.httpService.post('/search', body).pipe(
      map((response) => response.data),
      map((data) => this.mappingReleaseFields.mapReleaseFields(data)),
    );
  }

  async getDocumentStream(encryptedValue: string): Promise<any> {
    // Here we have to use a decrypt function to decrypt document id
    const documentId = this.encryptionService.decrypt(encryptedValue);
    // Preparing document Jira URL
    const documentUrl = `${this.configServices.get('BASE_URL')}/secure/attachment/${documentId}/content`;
    // Create a custom header
    const headers = {
      Accept: 'application/octet-stream',
    };

    try {
      // Call Jira api to download document
      const response = await lastValueFrom(
        this.httpService.get(documentUrl, {
          headers,
          responseType: 'stream',
        }),
      );
      // Return document data by stream
      return response.data;
    } catch (error) {
      console.error('Failed to get document stream', error);
      throw new HttpException(
        'Failed to get document stream: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
  const isFederal = (item: any) =>
    !item.spt || item.spt.trim() === '' || item.spt.trim() === 'US - Federal';
  const isState = (item: any) => {
    const spt = item.spt?.trim() ?? '';
    const locality = item.locality?.trim() ?? '';
    return (
      spt !== '' &&
      spt !== 'US - Federal' &&
      (locality === '' || locality.toLowerCase() === 'none')
    );
  };
  const isLocal = (item: any) => {
    const spt = item.spt?.trim() ?? '';
    const locality = item.locality?.trim() ?? '';
    return (
      spt !== '' &&
      spt !== 'US - Federal' &&
      locality !== '' &&
      locality.toLowerCase() !== 'none'
    );
  };

  // Split legislation to group by
  const federal = updates.filter(isFederal);
  const state = updates.filter(isState);
  const local = updates.filter(isLocal);

  // Determine the alpha descending comparison
  // const alphaDesc = (a: string, b: string) =>
  //   b.toUpperCase().localeCompare(a.toUpperCase());

  // sort by legislation
  const sortFederal = (list: any[]) =>
    [...list].sort((a, b) => {
      const roadmapCompare =
        a.roadmapGroup?.localeCompare(b.roadmapGroup ?? '') ?? 0;
      if (roadmapCompare !== 0) return roadmapCompare;
      return a.lTitle?.localeCompare(b.lTitle ?? '') ?? 0;
    });

  const sortState = (list: any[]) =>
    [...list].sort((a, b) => {
      const roadmapCompare =
        a.roadmapGroup?.localeCompare(b.roadmapGroup ?? '') ?? 0;
      if (roadmapCompare !== 0) return roadmapCompare;
      const sptCompare = a.spt?.localeCompare(b.spt ?? '') ?? 0;
      if (sptCompare !== 0) return sptCompare;
      return a.lTitle?.localeCompare(b.lTitle ?? '') ?? 0;
    });

  const sortLocal = (list: any[]) =>
    [...list].sort((a, b) => {
      const roadmapCompare =
        a.roadmapGroup?.localeCompare(b.roadmapGroup ?? '') ?? 0;
      if (roadmapCompare !== 0) return roadmapCompare;
      const localCompare = a.locality?.localeCompare(b.locality ?? '') ?? 0;
      if (localCompare !== 0) return localCompare;
      return a.lTitle?.localeCompare(b.lTitle ?? '') ?? 0;
    });

  return [...sortFederal(federal), ...sortState(state), ...sortLocal(local)];
}

function groupAndSortLegislativeUpdates2(issues: any[]): any[] {
  // Determine the legislation level
  const getLevel = (item: any): number => {
    if (!item.spt || item.spt === 'US - Federal') return 0; // Federal
    if (
      item.spt &&
      (!item.locality ||
        item.locality.trim() === '' ||
        item.locality.trim() === 'None')
    )
      return 1; // State
    return 2; // Local
  };

  const getSortKey = (item: any): string[] => {
    const level = getLevel(item).toString(); // 0, 1, 2
    const roadmap = item.roadmapGroup ?? '';
    const spt = item.spt ?? '';
    const locality = item.locality ?? '';
    const lTitle = item.lTitle ?? '';

    return [
      level,
      roadmap.toUpperCase(),
      locality.toUpperCase(),
      spt.toUpperCase(),
      lTitle.toUpperCase(),
    ];
  };

  return [...issues].sort((a, b) => {
    const keyA = getSortKey(a);
    const keyB = getSortKey(b);

    for (let i = 0; i < keyA.length; i++) {
      if (keyA[i] < keyB[i]) return -1;
      if (keyA[i] > keyB[i]) return 1;
    }
    return 0;
  });
}
