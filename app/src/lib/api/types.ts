export interface ApiErrorEnvelope {
  code: string;
  message: string;
  details?: unknown;
}

export interface UIError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface DatasetSummary {
  id: string;
  name: string;
  uploadedAt: string;
  status: 'ready' | 'processing' | 'failed';
}

export interface AnalyticsRecord {
  year: number;
  semester: string;
  major: string;
  school: string;
  studentType: 'FTIC' | 'Transfer' | 'Continuing' | 'Dual Enrollment';
  count: number;
}

export interface MigrationRecord {
  fromMajor: string;
  toMajor: string;
  semester: string;
  count: number;
}

export interface MajorCohortRecord {
  major: string;
  cohort: string;
  avgGPA: number;
  avgCredits: number;
  studentCount: number;
}

export interface TrendPoint {
  period: string;
  year: number;
  semester: number;
  total: number;
}

export interface ForecastPoint extends TrendPoint {
  isForecasted: true;
}

export interface SnapshotTotals {
  total: number;
  undergrad: number;
  ftic: number;
  transfer: number;
  international: number;
}

export interface MajorCount {
  major: string;
  count: number;
}

export interface SchoolCount {
  school: string;
  count: number;
}

export interface StudentTypeCount {
  type: string;
  count: number;
}

export interface DatasetOverviewResponse {
  datasetId: string;
  asOfDate: string;
  snapshotTotals: SnapshotTotals;
  studentTypeDistribution: StudentTypeCount[];
  schoolDistribution: SchoolCount[];
  trendSeries: TrendPoint[];
  majorCount: number;
  schoolCount: number;
}

export interface AnalyticsRecordsResponse {
  datasetId: string;
  records: AnalyticsRecord[];
}

export interface MajorsAnalyticsResponse {
  datasetId: string;
  majorDistribution: MajorCount[];
  cohortRecords: MajorCohortRecord[];
}

export interface MigrationAnalyticsResponse {
  datasetId: string;
  semesters: string[];
  records: MigrationRecord[];
}

export interface ForecastsAnalyticsResponse {
  datasetId: string;
  historicalSeries: TrendPoint[];
  forecastSeries: ForecastPoint[];
  fiveYearGrowth: number;
}

export type SubmissionStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export interface DatasetSubmission {
  id: string;
  datasetId?: string;
  datasetName: string;
  status: SubmissionStatus;
  createdAt: string;
}

export interface CreateSubmissionRequest {
  file: File;
}
