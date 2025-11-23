import React from 'react';
import { Header } from './components/Header';
import { FileUploadPanel } from './components/FileUploadPanel';
import { MetricTile } from './components/MetricTile';
import { MajorInsights } from './components/MajorInsights';
import { ExportButton } from './components/ExportButton';
import { Users, User, ChevronsRight, Globe, TrendingUp } from 'lucide-react';
import { majorSummaryData, summaryMetrics } from './constants';

const App = () => {
  const icons = [
    <Users key="total" className="h-8 w-8 text-blue-500" />,
    <User key="undergrad" className="h-8 w-8 text-green-500" />,
    <ChevronsRight key="ftic" className="h-8 w-8 text-indigo-500" />,
    <TrendingUp key="transfer" className="h-8 w-8 text-amber-500" />,
    <Globe key="international" className="h-8 w-8 text-red-500" />,
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />
        <main className="space-y-6">
          <FileUploadPanel />

          <section>
            <h2 className="text-xl font-semibold text-slate-700 mb-4">
              Enrollment Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {summaryMetrics.map((metric, index) => (
                <MetricTile
                  key={metric.title}
                  title={metric.title}
                  value={metric.value}
                  icon={icons[index]}
                />
              ))}
            </div>
          </section>

          <MajorInsights data={majorSummaryData} />

          <div className="flex justify-end pt-4">
            <ExportButton />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
