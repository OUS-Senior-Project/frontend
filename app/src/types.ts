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

/** Per-program metrics from API (snake_case). */
export interface ProgramMetricItem {
  average_gpa: number;
  average_credits: number;
  student_count: number;
}

/** Classification name -> program name -> metrics. */
export type ByClassAndProgram = Record<
  string,
  Record<string, ProgramMetricItem>
>;

export interface ProgramMetrics {
  by_class_and_program: ByClassAndProgram;
}

export interface EnrollmentResponse {
  summaryMetrics: SummaryMetric[];
  majorSummaryData: MajorData[];
  program_metrics?: ProgramMetrics;
}
