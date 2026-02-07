import type { MajorCohortRecord } from '@/types/analytics';
import { cohorts, majors } from './constants';
import { seededRandom } from './random';

const MAJOR_GPA_BASE: Record<string, number> = {
  Biology: 3.1,
  Chemistry: 2.9,
  'Computer Science': 3.2,
  Psychology: 3.3,
  'Business Administration': 3.0,
  Communications: 3.4,
  'Electrical Engineering': 2.8,
  'Civil Engineering': 2.9,
  Nursing: 3.3,
  'Political Science': 3.1,
  Economics: 3.0,
  English: 3.5,
  Mathematics: 2.7,
  Accounting: 2.9,
  Marketing: 3.2,
};

const MAJOR_COUNT_BASE: Record<string, number> = {
  Biology: 120,
  Chemistry: 65,
  'Computer Science': 180,
  Psychology: 95,
  'Business Administration': 200,
  Communications: 85,
  'Electrical Engineering': 55,
  'Civil Engineering': 40,
  Nursing: 75,
  'Political Science': 60,
  Economics: 55,
  English: 45,
  Mathematics: 30,
  Accounting: 70,
  Marketing: 90,
};

export function generateMajorCohortDataFixture(): MajorCohortRecord[] {
  const data: MajorCohortRecord[] = [];
  const rand = seededRandom(456);

  cohorts.forEach((cohort, cohortIdx) => {
    majors.forEach((major) => {
      const avgGPA = Math.max(
        2.0,
        Math.min(
          3.8,
          MAJOR_GPA_BASE[major] +
            (cohortIdx - 1.5) * 0.08 +
            (rand() - 0.5) * 0.4
        )
      );
      const avgCredits = Math.max(
        3,
        Math.min(30, Math.round(15 + cohortIdx * 3.5 + (rand() - 0.5) * 6))
      );
      const studentCount = Math.max(
        1,
        Math.round(
          MAJOR_COUNT_BASE[major] *
            (1 + cohortIdx * 0.12) *
            (0.75 + rand() * 0.5)
        )
      );

      data.push({
        major,
        cohort,
        avgGPA: Math.round(avgGPA * 100) / 100,
        avgCredits,
        studentCount,
      });
    });
  });

  return data;
}
