import React from 'react';
import { GPABarChart } from './GPABarChart';
import { CreditsBarChart } from './CreditsBarChart';
import { MajorSummaryTable } from './MajorSummaryTable';

export const MajorInsights = ({ data }) => {
  return (
    <section className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-700 mb-6">
        Major Insights
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="h-80">
          <h3 className="text-lg font-medium text-slate-600 mb-2 text-center">
            Average GPA by Major
          </h3>
          <GPABarChart data={data} />
        </div>

        <div className="h-80">
          <h3 className="text-lg font-medium text-slate-600 mb-2 text-center">
            Average Credits Earned by Major
          </h3>
          <CreditsBarChart data={data} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-slate-600 mb-4">
          Major-Level Summary
        </h3>
        <MajorSummaryTable data={data} />
      </div>
    </section>
  );
};
