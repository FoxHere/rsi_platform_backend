import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { JiraConvertToHtml } from '../transformers/jira_api.converttohtml.service';
import { LocalWikitextToHtmlConverter } from '../transformers/jira_api.localwikitexttohtml.service';

@Injectable()
export class JiraApiDataMappingService {
  constructor(
    private jiraConvertToHtml: JiraConvertToHtml,
    private converter: LocalWikitextToHtmlConverter,
  ) {}

  async mapFieldsPdDocument(data: any): Promise<any> {
    const fieldsMappedPromises = data.issues.map(async (item) => ({
      id: String(item.id).toString(),
      key: item.key,
      fields: {
        legislative_title: item.fields.summary,
        legislative_description: String(
          item.fields.customfield_13705,
        ).replaceAll('{html}', ''),
        product_line: item.fields.customfield_11811,
        application_area: item.fields.customfield_11607,
        country: item.fields.customfield_12212,
        s_p_t: item.fields.customfield_11601,
        update_id: 'SAP00' + String(item.key).split('-')[1].toString(),
        sources: [],
        business_impact: '',
        system_impact: '',
      },
    }));

    const fieldsMapped = await Promise.all(fieldsMappedPromises);
    return {
      total: data.issues.length,
      issues: fieldsMapped,
    };
  }
}
