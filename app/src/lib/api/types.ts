export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface UIError {
  code: string;
  message: string;
  retryable: boolean;
  details?: unknown;
  requestId?: string;
  status?: number;
}

export type DatasetStatus =
  | 'queued'
  | 'building'
  | 'processing'
  | 'ready'
  | 'failed';

export interface DatasetSummary {
  datasetId: string;
  name: string;
  status: DatasetStatus;
  isActive: boolean;
  createdAt: string;
  sourceSubmissionId: string | null;
}

export type DatasetDetail = DatasetSummary;

export interface DatasetListResponse {
  items: DatasetSummary[];
  page: number;
  pageSize: number;
  total: number;
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
  avgGPA: number | null;
  avgCredits: number | null;
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

export interface DatasetTrendPoint {
  period: string;
  year: number;
  semester: string;
  total: number;
}

export interface DatasetForecastPoint extends DatasetTrendPoint {
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
  snapshotTotals: SnapshotTotals;
  activeMajors: number;
  activeSchools: number;
  trend: DatasetTrendPoint[];
  studentTypeDistribution: StudentTypeCount[];
  schoolDistribution: SchoolCount[];
}

export interface AnalyticsRecordsResponse {
  datasetId: string;
  records: AnalyticsRecord[];
}

export interface MajorCohortRecordsResponse {
  datasetId: string;
  records: MajorCohortRecord[];
}

export interface MajorsAnalyticsResponse {
  datasetId: string;
  analyticsRecords: AnalyticsRecord[];
  majorDistribution: MajorCount[];
  cohortRecords: MajorCohortRecord[];
}

export interface MigrationRecordsResponse {
  datasetId: string;
  records: MigrationRecord[];
}

export interface MigrationOptionsResponse {
  datasetId: string;
  semesters: string[];
}

export interface MigrationAnalyticsResponse {
  datasetId: string;
  semesters: string[];
  records: MigrationRecord[];
}

export interface ForecastInsights {
  projectedGrowthText: string;
  resourcePlanningText: string;
  recommendationText: string;
}

export interface DatasetForecastResponse {
  datasetId: string;
  fiveYearGrowthPct: number;
  historical: DatasetTrendPoint[];
  forecast: DatasetForecastPoint[];
  insights: ForecastInsights;
}

export type ForecastsAnalyticsResponse = DatasetForecastResponse;

export interface ErrorDetail {
  code?: string;
  message?: string;
  [key: string]: unknown;
}

export type SubmissionStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface SubmissionStatusResponse {
  submissionId: string;
  datasetId: string;
  status: SubmissionStatus;
  fileName: string;
  createdAt: string;
  completedAt: string | null;
  validationErrors: ErrorDetail[];
}

export interface SubmissionHistoryItem {
  submissionId: string;
  datasetId: string;
  status: SubmissionStatus;
  fileName: string;
  createdAt: string;
  completedAt: string | null;
}

export interface SubmissionHistoryListResponse {
  items: SubmissionHistoryItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface DatasetSubmission {
  submissionId: string;
  datasetId: string;
  status: SubmissionStatus;
  fileName: string;
  createdAt: string;
  completedAt?: string | null;
  validationErrors?: ErrorDetail[];
}

export interface CreateSubmissionRequest {
  file: File;
  activateOnSuccess?: boolean;
}

export type BulkJobStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type BulkJobItemStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface BulkSubmissionCreateResponse {
  jobId: string;
  status: BulkJobStatus;
  totalFiles: number;
  activateLatest: boolean;
  continueOnError: boolean;
  dryRun: boolean;
  createdAt: string;
}

export interface BulkSubmissionFileResult {
  fileOrder: number;
  fileName: string;
  status: BulkJobItemStatus;
  submissionId: string | null;
  datasetId: string | null;
  completedAt: string | null;
  validationErrors: ErrorDetail[];
  error: ErrorDetail | null;
}

export interface BulkSubmissionStatusResponse {
  jobId: string;
  status: BulkJobStatus;
  totalFiles: number;
  processedFiles: number;
  succeededFiles: number;
  failedFiles: number;
  activateLatest: boolean;
  continueOnError: boolean;
  dryRun: boolean;
  activatedDatasetId: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  results: BulkSubmissionFileResult[];
}
