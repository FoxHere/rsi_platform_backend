import { Injectable } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { JiraCustomFields } from 'src/common/helpers/helpers.custom_fields.enum';
import { HttpService } from '@nestjs/axios';
import { MappingReleaseFieldsService } from './mapping/mapping.release_fields.service';

@Injectable()
export class ReleaseService {
  constructor(
    private readonly httpService: HttpService,
    private mappingReleaseFields: MappingReleaseFieldsService,
  ) {}

  findAllReleases(filters: any): Observable<any> {
    // Create a inicial jql to use the fixed query to retrieve information
    let jqlQuery =
      "project = 'SAP US Payroll' AND type = 'Release Tracker' AND labels = Document AND ReleaseDate > startOfYear()";

    // Apply filters if exists ----------------------------------------------------
    filters.productLine
      ? (jqlQuery += ` AND "Product Line" = "${filters.productLine}"`)
      : jqlQuery;
    //-----------------------------------------------------------------------------

    const body = {
      jql: (jqlQuery += ' ORDER BY ReleaseDate ASC'),
      fields: [JiraCustomFields.FixVersions, JiraCustomFields.ReleaseStatus],
    };
    return this.httpService.post('/search', body).pipe(
      map((response) => response.data),
      map((data) => {
        return this.mappingReleaseFields.mapReleaseFields(data);
      }),
    );
  }
}
