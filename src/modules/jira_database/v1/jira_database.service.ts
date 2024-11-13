import { BadGatewayException, HttpException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JiraLocalDatabaseEntity } from './entities/jira_local_database.entity';
import { JiraApiService } from '../../jira_api/jira_api.service';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class JiraDatabaseService {
  constructor(
    @InjectRepository(JiraLocalDatabaseEntity)
    private readonly jiraLocalDatabaseRepository: Repository<JiraLocalDatabaseEntity>,
    @InjectDataSource('jiraConnection') private dataSource: DataSource,
    private jiraApiService: JiraApiService,
  ) {}

  async syncDataJiraAndLocalDatabase() {
    const jiraApiResult = await lastValueFrom(
      this.jiraApiService.findAllPdDocument(),
    );

    await jiraApiResult.issues.map(async (issue) => {
      try {
        const jiraLocalDatabase = new JiraLocalDatabaseEntity();
        jiraLocalDatabase.projectKey = issue.key;
        jiraLocalDatabase.legislativeTitle = issue.fields.legislative_title;
        jiraLocalDatabase.legislativeDescription =
          issue.fields.legislative_description;
        jiraLocalDatabase.productLine = issue.fields.product_line;
        jiraLocalDatabase.applicationArea = issue.fields.application_area;
        jiraLocalDatabase.country = issue.fields.country;
        jiraLocalDatabase.spt =
          issue.fields.s_p_t == null ? '' : issue.fields.s_p_t;
        jiraLocalDatabase.updateId = issue.fields.update_id;
        jiraLocalDatabase.sources = '';
        jiraLocalDatabase.businessImpact = issue.fields.business_impact;
        jiraLocalDatabase.systemImpact = issue.fields.system_impact;
        return await this.jiraLocalDatabaseRepository.save(jiraLocalDatabase);
      } catch (error) {
        console.log(error);
      }
    });

    return 'synchronized!';
  }

  async getJiraData(): Promise<JiraDataResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    const query = `
    select
      p.id as "ProjectId",
      p.pname as "ProjectName",
      p.pkey as "ProjectKey",
      p.pcounter as "ProjectCounter",
      na.source_node_id,
      na.source_node_entity,
      na.sink_node_id,
      na.sink_node_entity,
      na.association_type,
      pc.id as pc_id,
      pc.cname as pc_name,
      pv.vname as pv_name,
      na2.association_type as association_type2,
      it.pname,
      ji.issuenum,
      ji.summary,
      l.label,
      max(case when cf.cfname = 'Legislative Summary' then cfv.textvalue end) as "LegislativeSummary",
      max(case when cf.cfname = 'Country' then cfv.textvalue end) as "Country"
      
      from project as p 
      join nodeassociation as na on na.source_node_id = p.id
      join projectcategory as pc on pc.id = na.sink_node_id and na.association_type = 'ProjectCategory'
      join projectversion  as pv on p.id = pv.project 
      left join nodeassociation as na2 on pv.id = na2.sink_node_id and na2.association_type = 'IssueFixVersion'
      left join jiraissue as ji on ji.id = na2.source_node_id
      left join issuetype as it on it.id = ji.issuetype
      left join customfield as cf on cf.id <> 0
      left join customfieldvalue as cfv on cfv.customfield = cf.id and cfv.issue = ji.id
      left join label as l on l.issue = ji.id
    where
      p.pname = 'SAP US Payroll'
    and pv.vname = 'RS23SAP-US-P01'
    and it.pname = 'Story'
    and cf.cfname in ('Legislative Summary', 'Country')
    and l.label = 'ALS'
    
    group by p.id, p.pname, p.pkey, p.pcounter, na.source_node_id, na.source_node_entity, 
        na.sink_node_id, na.sink_node_entity, na.association_type, pc.id, pc.cname, 
        pv.vname, na2.association_type, it.pname, ji.issuenum, ji.summary, l.label;
      
    `;
    await queryRunner.connect();
    try {
      const queryResult = await queryRunner.query(query);
      const formattedData: JiraProjectIssueData[] = queryResult.map(
        (issue) => ({
          ProjectId: issue.ProjectId,
          ProjectName: issue.ProjectName,
          ProjectKey: issue.ProjectKey,
          ProjectCounter: issue.ProjectCounter,
          source_node_id: issue.source_node_id,
          source_node_entity: issue.source_node_entity,
          sink_node_id: issue.sink_node_id,
          sink_node_entity: issue.sink_node_entity,
          association_type: issue.association_type,
          pc_id: issue.pc_id,
          pc_name: issue.pc_name,
          pv_name: issue.pv_name,
          association_type2: issue.association_type2,
          pname: issue.pname,
          issuenum: issue.issuenum,
          fields: {
            summary: issue.summary,
            label: issue.label,
            LegislativeSummary: issue.LegislativeSummary,
            Country: issue.Country,
          },
        }),
      );

      return {
        total: queryResult.length,
        issues: formattedData,
        message: `Total items found ${queryResult.length}`,
      };
    } finally {
      await queryRunner.release();
    }
  }
}

interface JiraProjectIssueData {
  ProjectId: number;
  ProjectName: string;
  ProjectKey: string;
  ProjectCounter: number;
  source_node_id: number;
  source_node_entity: string;
  sink_node_id: number;
  sink_node_entity: string;
  association_type: string;
  pc_id: number;
  pc_name: string;
  pv_name: string;
  association_type2: string;
  pname: string;
  issuenum: number;
  fields: {
    summary: string;
    label: string;
    LegislativeSummary: string;
    Country: string;
  };
}
export interface JiraDataResult {
  issues: JiraProjectIssueData[];
  total: number;
  message: string;
}
