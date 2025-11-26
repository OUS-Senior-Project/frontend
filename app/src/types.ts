export interface SummaryMetric {
  title: string;
  value: string | number;
}

export interface MajorData {
  major: string;
  avgGpa: number;
  avgCredits: number;
  studentCount: number;
}

export interface EnrollmentResponse {
  summaryMetrics: SummaryMetric[];
  majorSummaryData: MajorData[];
}
