import React, { useMemo, useState } from 'react';
import { Header } from './components/Header';
import { FileUploadPanel } from './components/FileUploadPanel';
import { MetricTile } from './components/MetricTile';
import { MajorInsights } from './components/MajorInsights';
import { ExportButton } from './components/ExportButton';
import { Users, User, ChevronsRight, Globe, TrendingUp } from 'lucide-react';
import type {
  MajorData,
  ProgramMetrics,
  SummaryMetric,
  UploadResponse,
  ByClassAndProgram,
} from './types';

function enrollmentMetricsToSummaryMetrics(
  em: UploadResponse['enrollment_metrics']
): SummaryMetric[] {
  return [
    { title: 'Total Enrollment', value: em.total_enrollment },
    {
      title: 'Undergraduate Students',
      value: em.undergraduate_enrollment.total,
    },
    { title: 'FTIC Students', value: em.ftic_enrollment.total },
    { title: 'Transfer Students', value: em.transfer_enrollment.total },
    { title: 'International Students', value: '—' },
  ];
}

function byClassAndProgramToMajorData(
  byClassAndProgram: ByClassAndProgram
): MajorData[] {
  const byProgram: Record<
    string,
    { totalStudents: number; weightedGpa: number; weightedCredits: number }
  > = {};
  for (const programs of Object.values(byClassAndProgram)) {
    for (const [programName, m] of Object.entries(programs)) {
      if (!byProgram[programName]) {
        byProgram[programName] = {
          totalStudents: 0,
          weightedGpa: 0,
          weightedCredits: 0,
        };
      }
      byProgram[programName].totalStudents += m.student_count;
      byProgram[programName].weightedGpa += m.average_gpa * m.student_count;
      byProgram[programName].weightedCredits +=
        m.average_credits * m.student_count;
    }
  }
  return Object.entries(byProgram).map(([major, agg]) => ({
    major,
    studentCount: agg.totalStudents,
    avgGpa: agg.totalStudents > 0 ? agg.weightedGpa / agg.totalStudents : 0,
    avgCredits:
      agg.totalStudents > 0 ? agg.weightedCredits / agg.totalStudents : 0,
  }));
}

const App: React.FC = () => {
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

  const icons = useMemo(
    () => [
      <Users key="total" className="h-8 w-8 text-blue-500" />,
      <User key="undergrad" className="h-8 w-8 text-green-500" />,
      <ChevronsRight key="ftic" className="h-8 w-8 text-indigo-500" />,
      <TrendingUp key="transfer" className="h-8 w-8 text-amber-500" />,
      <Globe key="international" className="h-8 w-8 text-red-500" />,
    ],
    []
  );

  const displayMetrics = useMemo(
    () =>
      uploadResult
        ? enrollmentMetricsToSummaryMetrics(uploadResult.enrollment_metrics)
        : [],
    [uploadResult]
  );

  const displayMajors = useMemo(
    () =>
      uploadResult
        ? byClassAndProgramToMajorData(
            uploadResult.program_metrics.by_class_and_program
          )
        : [],
    [uploadResult]
  );

  const displayProgramMetrics = useMemo(
    (): ProgramMetrics | null =>
      uploadResult
        ? {
            by_class_and_program:
              uploadResult.program_metrics.by_class_and_program,
          }
        : null,
    [uploadResult]
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />
        <main className="space-y-6">
          <FileUploadPanel onUploadSuccess={setUploadResult} />

          <section>
            <h2 className="text-xl font-semibold text-slate-700 mb-4">
              Enrollment Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {displayMetrics.map((metric, index) => (
                <MetricTile
                  key={metric.title}
                  title={metric.title}
                  value={metric.value}
                  icon={icons[index] ?? null}
                />
              ))}
            </div>
          </section>

          <MajorInsights
            data={displayMajors}
            programMetrics={displayProgramMetrics}
          />

          <div className="flex justify-end pt-4">
            <ExportButton />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
