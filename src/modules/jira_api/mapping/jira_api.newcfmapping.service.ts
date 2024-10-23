import { Injectable } from '@nestjs/common';
import { LocalWikitextToHtmlConverter } from '../transformers/jira_api.localwikitexttohtml.service';
import { JiraCustomFields } from '../helpers/custom_fields';

@Injectable()
export class JiraApiNewCFMappingService {
  constructor(private transformer: LocalWikitextToHtmlConverter) {}

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

  async mapNewCustomFields(data: any): Promise<any> {
    const mappedFieldsPromises = data.issues.map(async (issue) => {
      const ImagesAttachment = this.extractImageAttachments(
        issue.fields[JiraCustomFields.Attachments],
      );
      return {
        id: String(issue.id),
        key: issue[JiraCustomFields.Key],
        summary: issue.fields[JiraCustomFields.Summary],
        legislative_title: await this.transformer.removeWiki(
          issue.fields[JiraCustomFields.LegislativeTitle],
        ),
        legislative_summary: await this.transformer.conversor(
          issue.fields[JiraCustomFields.LegislativeSummary],
          ImagesAttachment,
        ),
        legislative_description: await this.transformer.conversor(
          issue.fields[JiraCustomFields.LegislativeDescription],
          ImagesAttachment,
        ),

        legislativeSourceLinks: await this.transformer.extrancLinksToJson(
          issue.fields[JiraCustomFields.LegislativeSourceLinks],
        ),
        legislative_business_impact: await this.transformer.conversor(
          issue.fields[JiraCustomFields.LegislativeBusinessImpact],
          ImagesAttachment,
        ),
        legislative_system_impact: await this.transformer.conversor(
          issue.fields[JiraCustomFields.LegislativeSystemImpact],
          ImagesAttachment,
        ),
        // Field that will return all attachments
        doc_attachments: await this.transformer.extractDocAttachments(
          issue.fields[JiraCustomFields.Attachments],
        ),
        // Fields that dont need transformation
        product_line: '',
        application_area: '',
        country: '',
        spt: '',
      };
    });

    const mappedFields = await Promise.all(mappedFieldsPromises);
    return {
      total: data.issues.length,
      issues: mappedFields,
    };
  }

  extractImageAttachments(attachments: any[]): string[] {
    return attachments
      .filter((attachment) => attachment.mimeType.startsWith('image'))
      .map((attachment) => attachment);
  }
}
