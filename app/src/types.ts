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

/** Enrollment counts from upload API (snake_case). */
export interface EnrollmentCounts {
  total: number;
  full_time: number;
  part_time: number;
}

/** Enrollment metrics from upload API (snake_case). */
export interface EnrollmentMetrics {
  total_enrollment: number;
  undergraduate_enrollment: EnrollmentCounts;
  ftic_enrollment: EnrollmentCounts;
  transfer_enrollment: EnrollmentCounts;
}

/** Program summary from upload API (snake_case). */
export interface ProgramSummary {
  total_students: number;
  class_totals: Record<string, number>;
  overall_average_gpa: number;
  overall_average_credits: number;
  unique_programs: number;
  most_popular_programs: Record<string, number>;
}

/** Full program metrics from upload API (snake_case). */
export interface UploadProgramMetrics {
  by_class_and_program: ByClassAndProgram;
  summary: ProgramSummary;
}

/** Response from POST /api/v1/upload (snake_case). */
export interface UploadResponse {
  file_id: string;
  filename: string;
  status: string;
  enrollment_metrics: EnrollmentMetrics;
  program_metrics: UploadProgramMetrics;
}
