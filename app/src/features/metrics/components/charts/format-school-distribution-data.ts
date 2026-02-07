interface SchoolDatum {
  school: string;
  count: number;
}

export function formatSchoolDistributionData(data: SchoolDatum[]) {
  return data.map((item) => ({
    ...item,
    shortName: item.school.replace('College of ', '').replace('School of ', ''),
  }));
}
