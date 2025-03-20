import { PlotScalarData } from '../context/WebSocketContext';
import { Card, Text, Title, Stack, useMantineTheme, useComputedColorScheme } from '@mantine/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PlotScalarVizProps {
  data: PlotScalarData;
  name: string;
  fullScreen?: boolean;
}

interface ChartDataPoint {
  x: number;
  y: number;
}

export function PlotScalarViz({ data, name, fullScreen = false }: PlotScalarVizProps) {
  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('dark');
  const isDark = computedColorScheme === 'dark';
  const primaryColor = theme.primaryColor;
  
  // Transform data into format needed by Recharts
  const chartData: ChartDataPoint[] = data.data_x.map(point => ({
    x: point[0],
    y: point[1]
  }));

  const chartContent = (
    <div style={{ width: '100%', height: fullScreen ? '100%' : 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
          />
          <XAxis 
            dataKey="x" 
            label={{ value: 'X', position: 'insideBottomRight', offset: -10 }}
            tick={{ fill: isDark ? theme.colors.gray[5] : theme.colors.gray[7] }}
          />
          <YAxis 
            label={{ value: 'Y', angle: -90, position: 'insideLeft' }}
            tick={{ fill: isDark ? theme.colors.gray[5] : theme.colors.gray[7] }}
          />
          <Tooltip 
            formatter={(value: number) => value.toFixed(4)}
            labelFormatter={(label: number) => `X: ${label.toFixed(4)}`}
            contentStyle={{ 
              backgroundColor: isDark ? theme.colors.dark[7] : theme.white,
              color: isDark ? theme.white : theme.black,
              border: `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[4]}`
            }}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke={theme.colors[primaryColor][isDark ? 4 : 6]}
            dot={false}
            activeDot={{ r: 8, fill: theme.colors[primaryColor][isDark ? 3 : 7] }}
            strokeWidth={fullScreen ? 2 : 1.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // If fullScreen, just return the chart without the card wrapper
  if (fullScreen) {
    return (
      <Stack gap="xs" style={{ height: '100%' }}>
        {chartContent}
      </Stack>
    );
  }

  // Regular card view for dashboard
  return (
    <Card withBorder p="md" radius="md">
      <Stack gap="xs">
        <Title order={4}>{name}</Title>
        <Text size="sm" c="dimmed">Scalar Plot Data</Text>
        {chartContent}
      </Stack>
    </Card>
  );
} 