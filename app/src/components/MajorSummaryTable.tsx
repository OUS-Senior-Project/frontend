import React from 'react';
import type { MajorData } from '../types';

interface MajorSummaryTableProps {
  data: MajorData[];
}

export const MajorSummaryTable: React.FC<MajorSummaryTableProps> = ({
  data,
}) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
            >
              Major
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
            >
              Avg GPA
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
            >
              Avg Credits
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
          {data.map((item) => (
            <tr key={item.major} className="hover:bg-slate-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                {item.major}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {item.avgGpa.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {item.avgCredits.toFixed(1)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {item.studentCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
