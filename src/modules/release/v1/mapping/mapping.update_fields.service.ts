import { Injectable } from '@nestjs/common';
import { DisplayRules } from 'src/common/helpers/helper.display_rules';
import { JiraCustomFields } from 'src/common/helpers/helpers.custom_fields.enum';
import { TrasformerJirawikiToHtml } from 'src/common/transformers/transformers.jirawiki_to_html.service';
import { ReleaseDetailsDto } from '../dto/release-details.dto';
import { ReleaseDetails } from '../interfaces/release_details.interface';

@Injectable()
export class MappingUpdateFieldsService {
  constructor(private displayRules: DisplayRules) {}

  async mapUpdateFields(data: any): Promise<ReleaseDetails[]> {
    const mappedFieldsPromises: ReleaseDetails[] = data.issues
      .filter(
        (issue: any) =>
          issue.fields[JiraCustomFields.lSummary] != null &&
          issue.fields[JiraCustomFields.lSummary] != '',
      )
      .map(async (issue: any) => {
        return {
          id: String(issue.id),
          key: issue[JiraCustomFields.Key],
          summary: issue.fields[JiraCustomFields.Summary],
          // ------------------------------------------------
          lTitle: await this.displayRules.alwaysDisplay(
            issue.fields[JiraCustomFields.lTitle],
            issue.fields[JiraCustomFields.Attachments],
            false,
            true,
          ),
          lSummary: await this.displayRules.alwaysDisplay(
            issue.fields[JiraCustomFields.lSummary],
            issue.fields[JiraCustomFields.Attachments],
            true,
          ),
          lDescription: await this.displayRules.alwaysDisplay(
            issue.fields[JiraCustomFields.lDescription],
            issue.fields[JiraCustomFields.Attachments],
            true,
          ),
          lSourceLinks: this.displayRules.displayLinks(
            issue.fields[JiraCustomFields.lSourceLinks],
          ),
          lBusinessImpact: await this.displayRules.alwaysDisplay(
            issue.fields[JiraCustomFields.lBusinessImpact],
            issue.fields[JiraCustomFields.Attachments],
            true,
          ),
          lSystemImpact: await this.displayRules.alwaysDisplay(
            issue.fields[JiraCustomFields.lSystemImpact],
            issue.fields[JiraCustomFields.Attachments],
            true,
          ),
          configSteps: await this.displayRules.displayWhenApplicable(
            issue.fields[JiraCustomFields.ConfigurationSteps],
            issue.fields[JiraCustomFields.configStepsStatus]?.value ?? '',
            issue.fields[JiraCustomFields.Attachments],
            true,
          ),
          userGuide: await this.displayRules.displayWhenApplicable(
            issue.fields[JiraCustomFields.UserGuide],
            issue.fields[JiraCustomFields.userGuideStatus]?.value ?? '',
            issue.fields[JiraCustomFields.Attachments],
            true,
          ),
          // Fields that dont need transformation
          productLine: issue.fields[JiraCustomFields.productLine] ?? '',
          applicationArea: issue.fields[JiraCustomFields.ApplicationArea] ?? '',
          country: issue.fields[JiraCustomFields.Country] ?? '',
          spt: issue.fields[JiraCustomFields.SPT] ?? '',
          locality: issue.fields[JiraCustomFields.Locality] ?? '',
          roadmapGroup: issue.fields[JiraCustomFields.roadmapGroup] ?? '',
          // Field that will return all attachments
          attachments: await this.displayRules.displayAttachments(
            issue.fields[JiraCustomFields.Attachments],
          ),
        };
      });

    const mappedFields: ReleaseDetails[] =
      await Promise.all(mappedFieldsPromises);
    return mappedFields;
  }
}
