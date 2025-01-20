import {
  HttpException,
  HttpStatus,
  Injectable,
  StreamableFile,
} from '@nestjs/common';
import * as https from 'https';
import { HttpService } from '@nestjs/axios';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable, firstValueFrom, lastValueFrom, map, tap } from 'rxjs';
import { JiraApiDataMappingService } from './mapping/jira_api.datamapping.service';
import { response } from 'express';
import { JiraApiNewCFMappingService } from './mapping/jira_api.newcfmapping.service';

import { createReadStream } from 'fs';
import { EncryptionService } from 'src/common/utils/utils.encryption.service';
import { JiraCustomFields } from 'src/common/helpers/helpers.custom_fields.enum';

@Injectable()
export class JiraApiService {
  constructor(
    private readonly httpService: HttpService,
    private jiraApiDataMappingService: JiraApiDataMappingService,
    private jiraApiNewFieldsMappingService: JiraApiNewCFMappingService,
    private readonly encryptionService: EncryptionService,
  ) {}

  findAllReleases(query: any): Observable<any> {
    // Create a inicial jql to use the fixed query to retrieve information
    let jqlQuery =
      "project = 'SAP US Payroll' AND type = 'Release Tracker' AND labels = Document AND ReleaseDate > startOfYear()";

    // Apply filters if exists ----------------------------------------------------
    query.productLine ??
      (jqlQuery += ` AND "Product Line" = "${query.productLine}"`);
    //-----------------------------------------------------------------------------

    const body = {
      jql: jqlQuery + ' ORDER BY ReleaseDate ASC',
      fields: [JiraCustomFields.FixVersions, JiraCustomFields.ReleaseStatus],
    };
    return this.httpService.post('/search', body).pipe(
      map((response) => response.data),
      map((data) => {
        return this.jiraApiNewFieldsMappingService.mapReleaseFields(data);
      }),
    );
  }

  findAllPdDocument(): Observable<any> {
    const body = {
      jql: "Project = 'SAP US Payroll' AND labels = ALS AND fixVersion = RS23SAP-US-P06 AND type = Story ORDER BY key ASC, summary ASC",

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

    var pddocuments: AxiosResponse<string, any>;
    return this.httpService.post('/search', body).pipe(
      // tap funcion is used to export data from pipe to the would outside
      tap((response) => (pddocuments = response.data)),
      map((response) => response.data),
      map((data) => {
        // console.log(JSON.stringify(data, null, 2));
        return this.jiraApiDataMappingService.mapFieldsPdDocument(data);
      }),
    );
  }

  findNewCustomFieldsTest(fixVersion: string): Observable<any> {
    const fixVersionStr = fixVersion ?? 'RS24SAP-US-P01';
    const body = {
      jql: `fixVersion = '${fixVersionStr}' and type = Epic`,
      // jql: 'fixVersion = DocRel01 And type = Documentation AND summary ~ "MB Doc 3" ORDER BY priority DESC, updated DESC',
      // jql: 'fixVersion = DocRel01 And type = Documentation ORDER BY priority DESC, updated DESC',
      // jql: 'fixVersion = RS24SAP-US-P08 and labels = GPDIP ORDER BY priority DESC, updated DESC',
      // jql: "project = 'SAP US Payroll' AND fixVersion = DocDemo01 and type = Documentation and labels = GPDIP ORDER BY key ASC, summary ASC",
      // jql: "project = 'SAP US Payroll' AND fixVersion = 'RS24SAP-US-P06' and type = Documentation and labels = GPDIP ORDER BY key ASC, summary ASC",
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
      map(async (data) => {
        return await this.jiraApiNewFieldsMappingService.mapNewCustomFields(
          data,
        );
      },),
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
