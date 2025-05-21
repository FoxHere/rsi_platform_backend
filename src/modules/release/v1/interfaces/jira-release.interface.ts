export interface JiraReleaseUpdate {
  version: string;
  releaseStatus: string;
  specialNotes: string;
  description: string;
  dueDate: string;
}
export interface JiraRelease {
  total: number;
  issues: JiraReleaseUpdate[];
}
