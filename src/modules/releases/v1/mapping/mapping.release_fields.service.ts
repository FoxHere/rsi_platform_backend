import { Injectable } from '@nestjs/common';

@Injectable()
export class MappingReleaseFieldsService {
  async mapReleaseFields(data: any): Promise<any> {
    const mappedReleasePromises = data.issues.map(async (release) => {
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
    });
    const mappedReleases = await Promise.all(mappedReleasePromises);
    return {
      total: data.issues.length,
      issues: mappedReleases,
    };
  }
}
