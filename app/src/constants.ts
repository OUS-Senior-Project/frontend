import type { MajorData, ProgramMetrics, SummaryMetric } from './types';

export const summaryMetrics: SummaryMetric[] = [
  { title: 'Total Enrollment', value: '10,542' },
  { title: 'Undergraduate Students', value: '9,876' },
  { title: 'FTIC Students', value: '2,134' },
  { title: 'Transfer Students', value: '841' },
  { title: 'International Students', value: '312' },
];

export const majorSummaryData: MajorData[] = [
  { major: 'Computer Sci.', avgGpa: 3.21, avgCredits: 45.2, studentCount: 412 },
  { major: 'Nursing', avgGpa: 3.34, avgCredits: 48.1, studentCount: 388 },
  { major: 'Biology', avgGpa: 3.12, avgCredits: 42.5, studentCount: 301 },
  { major: 'Psychology', avgGpa: 3.45, avgCredits: 46.8, studentCount: 289 },
  {
    major: 'Business Admin',
    avgGpa: 3.28,
    avgCredits: 44.0,
    studentCount: 350,
  },
];

export const programMetricsFallback: ProgramMetrics = {
  by_class_and_program: {
    Freshman: {
      'Bachelor of Science in Psychology': {
        average_gpa: 2.05,
        average_credits: 18,
        student_count: 1,
      },
      'Bachelor of Music': {
        average_gpa: 2.64,
        average_credits: 15,
        student_count: 2,
      },
      'Bachelor of Science in Biology': {
        average_gpa: 2.96,
        average_credits: 0,
        student_count: 1,
      },
    },
    Sophomore: {
      'Bachelor of Business Administration in Finance': {
        average_gpa: 2.42,
        average_credits: 40,
        student_count: 2,
      },
      'Bachelor of Science in Health Sciences': {
        average_gpa: 2.54,
        average_credits: 45,
        student_count: 2,
      },
    },
    Junior: {
      'Bachelor of Science in Computer Science': {
        average_gpa: 3.1,
        average_credits: 72,
        student_count: 5,
      },
    },
    Senior: {
      'Bachelor of Arts in Journalism': {
        average_gpa: 3.2,
        average_credits: 98,
        student_count: 3,
      },
    },
  },
};
