import { Injectable } from '@nestjs/common';
import {
  JiraRelease,
  JiraReleaseUpdate,
} from '../interfaces/jira-release.interface';
import { JiraCustomFields } from 'src/common/helpers/helpers.custom_fields.enum';
import { TrasformerJirawikiToHtml } from 'src/common/transformers/transformers.jirawiki_to_html.service';

@Injectable()
export class MappingReleaseFieldsService {
  constructor(private localTransform: TrasformerJirawikiToHtml) {}

  async mapReleaseFields(
    data: any,
    hasSpecialNotes: boolean = true,
  ): Promise<any> {
    const mappedReleasesPromises: JiraReleaseUpdate[] = data.issues.map(
      async (release: any) => {
        const ImagesAttachment = this.extractImageAttachments(
          release.fields[JiraCustomFields.Attachments],
        );
        return {
          version: release.fields.fixVersions[0].name,
          projectkey: release.fields.project.key,
          releaseStatus: release.fields.status.name,
          project: release.fields.project.key,
          ApplicationArea:
            release.fields[JiraCustomFields.ApplicationArea] ?? '',
          productLine: release.fields[JiraCustomFields.productLine] ?? '',
          SPT: release.fields[JiraCustomFields.SPT] ?? '',
          Country: release.fields[JiraCustomFields.Country] ?? '',
          ...(hasSpecialNotes && {
            specialNotes:
              release.fields[JiraCustomFields.specialNotes] != null
                ? await this.localTransform.conversor(
                    release.fields[JiraCustomFields.specialNotes],
                    ImagesAttachment,
                  )
                : '',
          }),
          description:
            release.fields.fixVersions[0].description ?? 'To Be Determined',
          dueDate:
            release.fields.fixVersions[0].releaseDate ?? 'To Be Determined',
          // : release.fields.fixVersions[0].releaseDate,
        };
      },
    );
    const mappedReleases = await Promise.all(mappedReleasesPromises);
    return {
      total: data.total,
      issues: mappedReleases,
    };
  }
  extractImageAttachments(attachments: any[]): string[] {
    return attachments
      .filter((attachment) => attachment.mimeType.startsWith('image'))
      .map((attachment) => attachment);
  }
}
