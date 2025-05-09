import { Injectable } from '@nestjs/common';
import { JiraCustomFields } from 'src/common/helpers/helpers.custom_fields.enum';
import { TrasformerJirawikiToHtml } from 'src/common/transformers/transformers.jirawiki_to_html.service';

@Injectable()
export class MappingUpdateFieldsService {
  constructor(private localTransform: TrasformerJirawikiToHtml) {}

  async mapSingleField(data: any): Promise<any> {
    const mappedFieldsPromises = data.issues.map(async (issue: any) => {
      const ImagesAttachment = this.extractImageAttachments(
        issue.fields[JiraCustomFields.Attachments],
      );
      return await this.localTransform.conversor(
        issue.fields[JiraCustomFields.specialNotes],
        ImagesAttachment,
      );
    });
    const mappedField = await Promise.all(mappedFieldsPromises);
    return mappedField[0];
  }
  async mapUpdateFields(data: any): Promise<any> {
    const mappedFieldsPromises = data.issues
      .filter(
        (issue: any) =>
          issue.fields[JiraCustomFields.LegislativeSummary] != null &&
          issue.fields[JiraCustomFields.LegislativeSummary] != '',
      )
      .map(async (issue: any) => {
        const ImagesAttachment = this.extractImageAttachments(
          issue.fields[JiraCustomFields.Attachments],
        );

        return {
          id: String(issue.id),
          key: issue[JiraCustomFields.Key],
          summary: issue.fields[JiraCustomFields.Summary],
          legislative_title: await this.localTransform.removeWiki(
            issue.fields[JiraCustomFields.LegislativeTitle],
          ),
          legislative_summary: await this.localTransform.conversor(
            issue.fields[JiraCustomFields.LegislativeSummary],
            ImagesAttachment,
          ),
          legislative_description: await this.localTransform.conversor(
            issue.fields[JiraCustomFields.LegislativeDescription],
            ImagesAttachment,
          ),

          legislativeSourceLinks: await this.localTransform.extrancLinksToJson(
            issue.fields[JiraCustomFields.LegislativeSourceLinks],
          ),
          legislative_business_impact: await this.localTransform.conversor(
            issue.fields[JiraCustomFields.LegislativeBusinessImpact],
            ImagesAttachment,
          ),
          legislative_system_impact: await this.localTransform.conversor(
            issue.fields[JiraCustomFields.LegislativeSystemImpact],
            ImagesAttachment,
          ),
          // Field that will return all attachments
          doc_attachments: await this.localTransform.extractDocAttachments(
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
    return mappedFields;
  }
  extractImageAttachments(attachments: any[]): string[] {
    return attachments
      .filter((attachment) => attachment.mimeType.startsWith('image'))
      .map((attachment) => attachment);
  }
}
