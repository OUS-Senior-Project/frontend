// Dummy student data for OUS Analytics
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
  semester: string; // e.g. "Fall 2021"
  count: number;
}

export interface MajorCohortRecord {
  major: string;
  cohort: string; // e.g. "FTIC 2021"
  avgGPA: number;
  avgCredits: number;
  studentCount: number;
}

export const schools = [
  'College of Arts & Sciences',
  'School of Business',
  'School of Communications',
  'College of Engineering & Architecture',
  'School of Education',
  'College of Nursing & Allied Health',
  'School of Social Work',
];

export const majors = [
  'Biology',
  'Chemistry',
  'Computer Science',
  'Psychology',
  'Business Administration',
  'Communications',
  'Electrical Engineering',
  'Civil Engineering',
  'Nursing',
  'Political Science',
  'Economics',
  'English',
  'Mathematics',
  'Accounting',
  'Marketing',
];

export const majorToSchool: Record<string, string> = {
  Biology: 'College of Arts & Sciences',
  Chemistry: 'College of Arts & Sciences',
  'Computer Science': 'College of Engineering & Architecture',
  Psychology: 'College of Arts & Sciences',
  'Business Administration': 'School of Business',
  Communications: 'School of Communications',
  'Electrical Engineering': 'College of Engineering & Architecture',
  'Civil Engineering': 'College of Engineering & Architecture',
  Nursing: 'College of Nursing & Allied Health',
  'Political Science': 'College of Arts & Sciences',
  Economics: 'School of Business',
  English: 'College of Arts & Sciences',
  Mathematics: 'College of Arts & Sciences',
  Accounting: 'School of Business',
  Marketing: 'School of Business',
};

export const studentTypes = [
  'FTIC',
  'Transfer',
  'Continuing',
  'Dual Enrollment',
] as const;

export const semesters = [
  'Fall 2021',
  'Spring 2022',
  'Fall 2022',
  'Spring 2023',
  'Fall 2023',
  'Spring 2024',
];

export const cohorts = ['FTIC 2021', 'FTIC 2022', 'FTIC 2023', 'FTIC 2024'];

// Seeded random number generator for consistent data
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// Generate 5 years of student data (2019-2024)
export function generateAnalyticsData(): AnalyticsRecord[] {
  const data: AnalyticsRecord[] = [];
  const years = [2019, 2020, 2021, 2022, 2023, 2024];
  const semesterNames = ['Fall', 'Spring'];
  const rand = seededRandom(42);

  const baseStudentCounts: Record<string, number> = {
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

  years.forEach((year, yearIndex) => {
    semesterNames.forEach((semester) => {
      majors.forEach((major) => {
        const growthFactor = 1 + (yearIndex * 0.77) / 5;
        const seasonalFactor = semester === 'Fall' ? 1.05 : 0.95;
        const randomVariation = 0.9 + rand() * 0.2;

        studentTypes.forEach((type) => {
          let typeMultiplier = 1;
          if (type === 'FTIC') typeMultiplier = 0.25;
          if (type === 'Transfer') typeMultiplier = 0.15;
          if (type === 'Continuing') typeMultiplier = 0.55;
          if (type === 'Dual Enrollment') typeMultiplier = 0.05;

          const count = Math.round(
            baseStudentCounts[major] *
              growthFactor *
              seasonalFactor *
              randomVariation *
              typeMultiplier
          );

          data.push({
            year,
            semester,
            major,
            school: majorToSchool[major],
            studentType: type,
            count,
          });
        });
      });
    });
  });

  return data;
}

// Generate migration data by semester
export function generateMigrationData(): MigrationRecord[] {
  const migrations: MigrationRecord[] = [];
  const rand = seededRandom(123);

  const commonMigrations = [
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

  semesters.forEach((semester, semIdx) => {
    commonMigrations.forEach((migration) => {
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

// Generate major-level cohort data with GPA, credits, student count
export function generateMajorCohortData(): MajorCohortRecord[] {
  const data: MajorCohortRecord[] = [];
  const rand = seededRandom(456);

  const majorGPABase: Record<string, number> = {
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

  const majorCountBase: Record<string, number> = {
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

  cohorts.forEach((cohort, cohortIdx) => {
    majors.forEach((major) => {
      const gpaBase = majorGPABase[major];
      const cohortGPADrift = (cohortIdx - 1.5) * 0.08;
      const gpaVariation = (rand() - 0.5) * 0.4;
      const avgGPA = Math.max(
        2.0,
        Math.min(3.8, gpaBase + cohortGPADrift + gpaVariation)
      );

      const creditBase = 15 + cohortIdx * 3.5;
      const creditVariation = (rand() - 0.5) * 6;
      const avgCredits = Math.max(
        3,
        Math.min(30, Math.round(creditBase + creditVariation))
      );

      const countBase = majorCountBase[major];
      const cohortCountFactor = 1 + cohortIdx * 0.12;
      const countVariation = 0.75 + rand() * 0.5;
      const studentCount = Math.max(
        1,
        Math.round(countBase * cohortCountFactor * countVariation)
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

// Aggregate functions
export function getYearlyAnalytics(data: AnalyticsRecord[]) {
  const yearlyData: Record<number, number> = {};
  data.forEach((record) => {
    if (!yearlyData[record.year]) {
      yearlyData[record.year] = 0;
    }
    yearlyData[record.year] += record.count;
  });

  return Object.entries(yearlyData)
    .map(([year, total]) => ({
      year: parseInt(year),
      total: Math.round(total / 2),
    }))
    .sort((a, b) => a.year - b.year);
}

export function getAnalyticsByMajor(data: AnalyticsRecord[], year?: number) {
  const majorData: Record<string, number> = {};
  const filteredData = year ? data.filter((r) => r.year === year) : data;

  filteredData.forEach((record) => {
    if (!majorData[record.major]) {
      majorData[record.major] = 0;
    }
    majorData[record.major] += record.count;
  });

  return Object.entries(majorData)
    .map(([major, count]) => ({
      major,
      count: year ? count : Math.round(count / 12),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getAnalyticsBySchool(data: AnalyticsRecord[], year?: number) {
  const schoolData: Record<string, number> = {};
  const filteredData = year ? data.filter((r) => r.year === year) : data;

  filteredData.forEach((record) => {
    if (!schoolData[record.school]) {
      schoolData[record.school] = 0;
    }
    schoolData[record.school] += record.count;
  });

  return Object.entries(schoolData)
    .map(([school, count]) => ({
      school,
      count: year ? count : Math.round(count / 12),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getAnalyticsByStudentType(
  data: AnalyticsRecord[],
  year?: number
) {
  const typeData: Record<string, number> = {};
  const filteredData = year ? data.filter((r) => r.year === year) : data;

  filteredData.forEach((record) => {
    if (!typeData[record.studentType]) {
      typeData[record.studentType] = 0;
    }
    typeData[record.studentType] += record.count;
  });

  return Object.entries(typeData)
    .map(([type, count]) => ({
      type,
      count: year ? count : Math.round(count / 12),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getTrendData(data: AnalyticsRecord[]) {
  const trendData: Record<string, Record<string, number | string>> = {};

  data.forEach((record) => {
    const key = `${record.year}-${record.semester}`;
    if (!trendData[key]) {
      trendData[key] = {
        year: record.year,
        semester: record.semester === 'Fall' ? 1 : 2,
      };
    }
    if (!trendData[key].total) {
      trendData[key].total = 0;
    }
    (trendData[key].total as number) += record.count;
  });

  return Object.values(trendData)
    .map((item) => ({
      period: `${item.semester === 1 ? 'Fall' : 'Spring'} ${item.year}`,
      year: item.year as number,
      semester: item.semester as number,
      total: item.total as number,
    }))
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.semester - b.semester;
    });
}

// Generate forecast data
export function generateForecastData(
  historicalData: ReturnType<typeof getTrendData>
) {
  const lastFewPoints = historicalData.slice(-4);
  const avgGrowth =
    lastFewPoints.reduce((sum, point, idx, arr) => {
      if (idx === 0) return 0;
      return sum + (point.total - arr[idx - 1].total) / arr[idx - 1].total;
    }, 0) / 3;

  const lastPoint = historicalData[historicalData.length - 1];
  const forecasts = [];

  for (let i = 1; i <= 4; i++) {
    const year = lastPoint.year + Math.floor((lastPoint.semester + i - 1) / 2);
    const semester = ((lastPoint.semester + i - 1) % 2) + 1;
    const projectedTotal = Math.round(
      lastPoint.total * Math.pow(1 + avgGrowth, i)
    );

    forecasts.push({
      period: `${semester === 1 ? 'Fall' : 'Spring'} ${year}`,
      year,
      semester,
      total: projectedTotal,
      isForecasted: true,
    });
  }

  return forecasts;
}

// Get daily snapshot data (simulated for a given date)
export function getDailySnapshot(data: AnalyticsRecord[], date: Date) {
  // Determine which semester/year the date falls in
  const month = date.getMonth();
  const year = date.getFullYear();
  const semester = month >= 7 ? 'Fall' : 'Spring';
  const academicYear = semester === 'Spring' ? year : year;

  // Filter to the relevant semester
  const semesterData = data.filter(
    (r) => r.year === academicYear && r.semester === semester
  );

  // If no data for this period, use latest available
  if (semesterData.length === 0) {
    const latestYear = Math.max(...data.map((r) => r.year));
    const latestSemData = data.filter(
      (r) => r.year === latestYear && r.semester === 'Fall'
    );
    return latestSemData.length > 0
      ? latestSemData
      : data.filter((r) => r.year === latestYear);
  }

  return semesterData;
}

export function getSnapshotTotals(snapshotData: AnalyticsRecord[]) {
  const total = snapshotData.reduce((sum, r) => sum + r.count, 0);

  const undergrad = snapshotData
    .filter((r) => r.studentType !== 'Dual Enrollment')
    .reduce((sum, r) => sum + r.count, 0);

  const ftic = snapshotData
    .filter((r) => r.studentType === 'FTIC')
    .reduce((sum, r) => sum + r.count, 0);

  const transfer = snapshotData
    .filter((r) => r.studentType === 'Transfer')
    .reduce((sum, r) => sum + r.count, 0);

  // Mock international count as ~12% of total
  const international = Math.round(total * 0.12);

  return { total, undergrad, ftic, transfer, international };
}
