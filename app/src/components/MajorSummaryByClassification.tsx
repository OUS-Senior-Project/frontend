import React from 'react';
import type { ByClassAndProgram, ProgramMetricItem } from '../types';

const CLASSIFICATION_ORDER = [
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
] as const;

interface MajorSummaryByClassificationProps {
  byClassAndProgram: ByClassAndProgram;
}

const ProgramTable: React.FC<{
  classification: string;
  programs: Record<string, ProgramMetricItem>;
}> = ({ classification, programs }) => {
  const entries = Object.entries(programs);
  if (entries.length === 0) return null;

  return (
    <div className="mb-8 last:mb-0">
      <h4 className="text-base font-semibold text-slate-700 mb-3">
        {classification}
      </h4>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Program
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Average GPA
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Average Credits
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Student Count
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {entries.map(([programName, metrics]) => (
              <tr key={programName} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {programName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {metrics.average_gpa.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {metrics.average_credits}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {metrics.student_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const MajorSummaryByClassification: React.FC<
  MajorSummaryByClassificationProps
> = ({ byClassAndProgram }) => {
  const ordered = CLASSIFICATION_ORDER.filter(
    (c) => byClassAndProgram[c] && Object.keys(byClassAndProgram[c]).length > 0
  );
  const otherKeys = Object.keys(byClassAndProgram).filter(
    (k) =>
      !CLASSIFICATION_ORDER.includes(k as (typeof CLASSIFICATION_ORDER)[number])
  );
  const allOrdered = [...ordered, ...otherKeys];

  if (allOrdered.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">
        No program metrics by classification available.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {allOrdered.map((classification) => (
        <ProgramTable
          key={classification}
          classification={classification}
          programs={byClassAndProgram[classification]}
        />
      ))}
    </div>
  );
};
