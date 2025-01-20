export interface JiraReleaseUpdate {
  version: string;
  releaseStatus: string;
  description: string;
  dueDate: string;
}
export interface JiraRelease {
  total: number;
  issues: JiraReleaseUpdate[];
}
