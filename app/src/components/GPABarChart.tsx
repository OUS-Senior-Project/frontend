import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MajorData } from '../types';

interface GPABarChartProps {
  data: MajorData[];
}

export const GPABarChart: React.FC<GPABarChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="major" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 4]} tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #ccc',
            borderRadius: '0.5rem',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '14px' }} />
        <Bar
          dataKey="avgGpa"
          name="Avg. GPA"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
