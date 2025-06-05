import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  catchError,
  forkJoin,
  lastValueFrom,
  map,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { JiraCustomFields } from 'src/common/helpers/helpers.custom_fields.enum';
import { EncryptionService } from 'src/common/utils/utils.encryption.service';
import { MappingUpdateFieldsServiceOld } from 'src/modules/documents/pddocument/v1/mapping/mapping.update_fields.service';

@Injectable()
export class PddocumentService {
  constructor(
    private httpService: HttpService,
    private mappingUpdatesFields: MappingUpdateFieldsServiceOld,
    private encryptionService: EncryptionService,
  ) {}

  getSpecialNotes(fixVersion: string): Observable<any> {
    const body = {
      jql: `type = 'Release Tracker' AND fixVersion = ${fixVersion}`,
      fields: [
        JiraCustomFields.specialNotes,
        JiraCustomFields.FixVersions,
        JiraCustomFields.project,
        JiraCustomFields.Attachments,
      ],
    };
    return this.httpService.post('/search', body).pipe(
      map((response) => response.data),
      switchMap((data) => {
        return this.mappingUpdatesFields.mapSingleField(data);
      }),
      catchError(() => of('')),
    );
  }

  buildPdDocuments(fixVersion: string): Observable<any> {
    const fixVersionStr = fixVersion ?? '';
    const body = {
      jql: ` fixVersion = '${fixVersionStr}' AND type in (Epic, Story, Documentation) AND "Legislative Title" is not EMPTY AND "Legislative Title" !~ "<None>"`,
      maxResults: 1000,
      fields: [
        JiraCustomFields.Key,
        JiraCustomFields.Summary,
        JiraCustomFields.lTitle,
        JiraCustomFields.lSummary,
        JiraCustomFields.lDescription,
        JiraCustomFields.lSourceLinks,
        JiraCustomFields.lBusinessImpact,
        JiraCustomFields.lSystemImpact,
        JiraCustomFields.Attachments,
      ],
    };

    const issuesRequest$ = this.httpService.post('/search', body).pipe(
      map((response) => response.data),
      switchMap((data) => {
        return this.mappingUpdatesFields.mapUpdateFields(data);
      }),
      catchError(() => of('')),
    );
    const specialNotes$ = this.getSpecialNotes(fixVersionStr);

    return forkJoin([issuesRequest$, specialNotes$]).pipe(
      map(([issuesData, specialNotes]) => ({
        total: issuesData.length,
        specialNotes: specialNotes ?? '',
        issues: issuesData,
      })),
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

    // return this.httpService.post('/search', body).pipe(
    //   map((response) => response.data),
    //   map((data) => {
    //     return this.mappingUpdatesFields.mapUpdateFields(data);
    //   }),
    //   catchError((err) => {
    //     if (err.code === 'ERR_BAD_REQUEST') {
    //       return throwError(
    //         () =>
    //           new BadRequestException(
    //             `The value '${fixVersion}' does not exist for the field 'fixVersion'`,
    //           ),
    //       );
    //     }
    //     if (err instanceof HttpException) {
    //       return throwError(() => err);
    //     }
    //     return throwError(
    //       () => new InternalServerErrorException('Unexpected error occured'),
    //     );
    //   }),
    // );
  }

  async getDocumentStream(encryptedValue: string): Promise<any> {
    // Here we have to use a decrypt function to decrypt document id
    const documentId = this.encryptionService.decrypt(encryptedValue);
    // Preparing document Jira URL
    const documentUrl = `https://jiraqa/secure/attachment/${documentId}/content`;
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
