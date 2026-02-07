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
