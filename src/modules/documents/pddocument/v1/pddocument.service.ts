import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { lastValueFrom, map, Observable } from 'rxjs';
import { JiraCustomFields } from 'src/common/helpers/helpers.custom_fields.enum';
import { EncryptionService } from 'src/common/utils/utils.encryption.service';
import { MappingUpdateFieldsService } from 'src/modules/documents/pddocument/v1/mapping/mapping.update_fields.service';

@Injectable()
export class PddocumentService {
  constructor(
    private httpService: HttpService,
    private mappingUpdatesFields: MappingUpdateFieldsService,
    private encryptionService: EncryptionService,
  ) {}

  buildPdDocuments(fixVersion: string): Observable<any> {
    const fixVersionStr = fixVersion ?? 'RS24SAP-US-P01';
    const body = {
      jql: `fixVersion = '${fixVersionStr}' and type = Epic`,
      fields: [
        JiraCustomFields.Key,
        JiraCustomFields.Summary,
        JiraCustomFields.LegislativeTitle,
        JiraCustomFields.LegislativeSummary,
        JiraCustomFields.LegislativeDescription,
        JiraCustomFields.LegislativeSourceLinks,
        JiraCustomFields.LegislativeBusinessImpact,
        JiraCustomFields.LegislativeSystemImpact,
        JiraCustomFields.Attachments,
      ],
    };

    return this.httpService.post('/search', body).pipe(
      map((response) => response.data),
      map((data) => {
        return this.mappingUpdatesFields.mapUpdateFields(data);
      }),
    );
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
