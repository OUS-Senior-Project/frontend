import type { AnalyticsRecord } from '@/features/metrics/types';
import { majorToSchool, majors, studentTypes } from './constants';
import { seededRandom } from './random';

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024];
const SEMESTERS = ['Fall', 'Spring'];
const BASE_STUDENT_COUNTS: Record<string, number> = {
  Biology: 450,
  Chemistry: 280,
  'Computer Science': 520,
  Psychology: 380,
  'Business Administration': 620,
  Communications: 340,
  'Electrical Engineering': 220,
  'Civil Engineering': 180,
  Nursing: 290,
  'Political Science': 260,
  Economics: 240,
  English: 190,
  Mathematics: 150,
  Accounting: 280,
  Marketing: 310,
};

function typeMultiplier(type: AnalyticsRecord['studentType']) {
  if (type === 'FTIC') return 0.25;
  if (type === 'Transfer') return 0.15;
  if (type === 'Continuing') return 0.55;
  return 0.05;
}

export function generateAnalyticsDataFixture(): AnalyticsRecord[] {
  const data: AnalyticsRecord[] = [];
  const rand = seededRandom(42);

  YEARS.forEach((year, yearIndex) => {
    SEMESTERS.forEach((semester) => {
      majors.forEach((major) => {
        const growthFactor = 1 + (yearIndex * 0.77) / 5;
        const seasonalFactor = semester === 'Fall' ? 1.05 : 0.95;
        const randomVariation = 0.9 + rand() * 0.2;

        studentTypes.forEach((studentType) => {
          const count = Math.round(
            BASE_STUDENT_COUNTS[major] *
              growthFactor *
              seasonalFactor *
              randomVariation *
              typeMultiplier(studentType)
          );

          data.push({
            year,
            semester,
            major,
            school: majorToSchool[major],
            studentType,
            count,
          });
        });
      });
    });
  });

  return data;
}
