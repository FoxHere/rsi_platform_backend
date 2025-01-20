interface ReleaseFilterInterface {
  productLine?: string;
  applicationArea?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export type ReleaseFilter = Partial<ReleaseFilterInterface>;
