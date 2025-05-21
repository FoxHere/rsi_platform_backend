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
          issue.fields[JiraCustomFields.lSummary] != null &&
          issue.fields[JiraCustomFields.lSummary] != '',
      )
      .map(async (issue: any) => {
        const ImagesAttachment = this.extractImageAttachments(
          issue.fields[JiraCustomFields.Attachments],
        );

        return {
          id: String(issue.id),
          key: issue[JiraCustomFields.Key],
          summary: issue.fields[JiraCustomFields.Summary],
          lTitle: await this.localTransform.removeWiki(
            issue.fields[JiraCustomFields.lTitle],
          ),
          lSummary: await this.localTransform.conversor(
            issue.fields[JiraCustomFields.lSummary],
            ImagesAttachment,
          ),
          lDescription: await this.localTransform.conversor(
            issue.fields[JiraCustomFields.lDescription],
            ImagesAttachment,
          ),
          lSourceLinks: this.localTransform.extrancLinksToJson(
            issue.fields[JiraCustomFields.lSourceLinks],
          ),
          lBusinessImpact: await this.localTransform.conversor(
            issue.fields[JiraCustomFields.lBusinessImpact],
            ImagesAttachment,
          ),
          lSystemImpact: await this.localTransform.conversor(
            issue.fields[JiraCustomFields.lSystemImpact],
            ImagesAttachment,
          ),
          configSteps: await this.localTransform.conversor(
            issue.fields[JiraCustomFields.ConfigurationSteps],
          ),
          userGuide: await this.localTransform.conversor(
            issue.fields[JiraCustomFields.UserGuide],
          ),
          // Fields that dont need transformation
          productLine: issue.fields[JiraCustomFields.productLine] ?? '',
          applicationArea: issue.fields[JiraCustomFields.ApplicationArea] ?? '',
          country: issue.fields[JiraCustomFields.Country] ?? '',
          spt: issue.fields[JiraCustomFields.SPT] ?? '',
          // Field that will return all attachments
          attachments: await this.localTransform.extractDocAttachments(
            issue.fields[JiraCustomFields.Attachments],
          ),
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
