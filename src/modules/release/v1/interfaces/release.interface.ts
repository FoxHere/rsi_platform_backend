export interface ReleaseIssues {
  fixVersion: string;
  projectKey: string;
  releaseStatus: string;
  applicationArea: string;
  productLine: string;
  spt: string;
  country: string;
  specialNotes: string;
  description: string;
  releaseDate: string;
}
export interface Release {
  total: number;
  issues: ReleaseIssues[];
}
