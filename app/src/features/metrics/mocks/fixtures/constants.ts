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
