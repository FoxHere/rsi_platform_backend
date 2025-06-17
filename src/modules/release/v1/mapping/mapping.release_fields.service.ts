import { Injectable } from '@nestjs/common';
import { Release, ReleaseIssues } from '../interfaces/release.interface';
import { JiraCustomFields } from 'src/common/helpers/helpers.custom_fields.enum';
import { DisplayRules } from 'src/common/helpers/helper.display_rules';

@Injectable()
export class MappingReleaseFieldsService {
  constructor(private displayRules: DisplayRules) {}

  async mapReleaseFields(data: any): Promise<Release> {
    const mappedReleasesPromises: ReleaseIssues[] = data.issues.map(
      async (release: any) => {
        return {
          fixVersion: release.fields.fixVersions[0].name,
          projectKey: release.fields.project.key,
          releaseStatus: release.fields.status.name,
          applicationArea:
            release.fields[JiraCustomFields.ApplicationArea] ?? '',
          productLine: release.fields[JiraCustomFields.productLine] ?? '',
          spt: release.fields[JiraCustomFields.SPT] ?? '',
          country: release.fields[JiraCustomFields.Country] ?? '',
          specialNotes: await this.displayRules.displayWhenApplicable(
            release.fields[JiraCustomFields.specialNotes],
            release.fields[JiraCustomFields.specialNotesStatus]?.value ?? '',
            release.fields[JiraCustomFields.Attachments],
            true,
          ),
          description:
            release.fields.fixVersions[0].description ?? 'To Be Determined',
          releaseDate:
            release.fields.fixVersions[0].releaseDate ?? 'To Be Determined',
        };
      },
    );
    const mappedReleases: ReleaseIssues[] = await Promise.all(
      mappedReleasesPromises,
    );
    return {
      total: data.total,
      issues: mappedReleases,
    };
  }
}
