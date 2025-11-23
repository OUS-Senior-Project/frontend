import React from 'react';
import type { ReactNode } from 'react';

interface MetricTileProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  title,
  value,
  icon,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 flex items-start space-x-4 transition-transform hover:scale-105 hover:shadow-lg">
      <div className="bg-slate-100 p-3 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
};
