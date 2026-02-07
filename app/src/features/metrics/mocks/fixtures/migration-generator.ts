import type { MigrationRecord } from '@/features/metrics/types';
import { semesters } from './constants';
import { seededRandom } from './random';

const COMMON_MIGRATIONS = [
  { from: 'Biology', to: 'Chemistry', base: 25 },
  { from: 'Biology', to: 'Nursing', base: 40 },
  { from: 'Chemistry', to: 'Biology', base: 15 },
  { from: 'Computer Science', to: 'Electrical Engineering', base: 20 },
  { from: 'Electrical Engineering', to: 'Computer Science', base: 35 },
  { from: 'Business Administration', to: 'Marketing', base: 30 },
  { from: 'Business Administration', to: 'Accounting', base: 28 },
  { from: 'Marketing', to: 'Communications', base: 18 },
  { from: 'Economics', to: 'Business Administration', base: 22 },
  { from: 'Psychology', to: 'Communications', base: 15 },
  { from: 'Political Science', to: 'Economics', base: 12 },
  { from: 'English', to: 'Communications', base: 20 },
  { from: 'Mathematics', to: 'Computer Science', base: 18 },
  { from: 'Civil Engineering', to: 'Electrical Engineering', base: 10 },
  { from: 'Accounting', to: 'Business Administration', base: 8 },
];

export function generateMigrationDataFixture(): MigrationRecord[] {
  const migrations: MigrationRecord[] = [];
  const rand = seededRandom(123);

  semesters.forEach((semester, semIdx) => {
    COMMON_MIGRATIONS.forEach((migration) => {
      const semFactor = 1 + semIdx * 0.08;
      const randomVariation = 0.7 + rand() * 0.6;

      migrations.push({
        fromMajor: migration.from,
        toMajor: migration.to,
        semester,
        count: Math.round(migration.base * semFactor * randomVariation),
      });
    });
  });

  return migrations;
}
