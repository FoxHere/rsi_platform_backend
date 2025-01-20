import { Injectable } from '@nestjs/common';
import {
  JiraRelease,
  JiraReleaseUpdate,
} from '../interfaces/jira-release.interface';

@Injectable()
export class MappingReleaseFieldsService {
  mapReleaseFields(data: any): JiraRelease {
    const mappedReleases: JiraReleaseUpdate[] = data.issues.map(
      (release: any) => {
        return {
          version: release.fields.fixVersions[0].name,
          releaseStatus: release.fields.status.name,
          description:
            release.fields.fixVersions[0].description != null
              ? release.fields.fixVersions[0].description
              : 'To Be Determined',
          dueDate:
            release.fields.fixVersions[0].releaseDate != null
              ? release.fields.fixVersions[0].releaseDate
              : 'To Be Determined',
          // : release.fields.fixVersions[0].releaseDate,
        };
      },
    );

    return {
      total: data.total,
      issues: mappedReleases,
    };
  }
}
