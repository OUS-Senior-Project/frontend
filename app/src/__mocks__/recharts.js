const Recharts = jest.requireActual('recharts');

module.exports = {
  ...Recharts,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
};
