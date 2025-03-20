import { useState, useMemo, useEffect, useRef } from 'react';
import { PlotScalarData } from '../context/WebSocketContext';
import { 
  Card, 
  Text, 
  Title, 
  Stack, 
  Group, 
  Badge,
  Button,
  Switch,
  Select,
  Box,
  Collapse,
  NumberInput,
  useMantineTheme, 
  useComputedColorScheme,
  Tooltip,
  Paper,
  Transition
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Plot from 'react-plotly.js';
import * as Plotly from 'plotly.js';
import { 
  IconMaximize, 
  IconAdjustments, 
  IconDownload
} from '@tabler/icons-react';

interface PlotVizProps {
  data: PlotScalarData;
  name: string;
  fullScreen?: boolean;
  onFullscreen?: () => void;
}

// Statistical component to show data insights
function StatsSummary({ data }: { data: { x: number; y: number }[] }) {
  if (!data.length) return <Text>No data available</Text>;
  
  // Calculate basic statistics
  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);
  
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  
  // Calculate mean
  const xMean = xValues.reduce((a, b) => a + b, 0) / xValues.length;
  const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
  
  // Format number to 4 decimal places
  const format = (num: number) => num.toFixed(4);
  
  return (
    <Stack gap="md">
      <Group grow>
        <Box>
          <Text fw={500}>X Statistics</Text>
          <Text size="sm">Min: {format(xMin)}</Text>
          <Text size="sm">Max: {format(xMax)}</Text>
          <Text size="sm">Mean: {format(xMean)}</Text>
          <Text size="sm">Range: {format(xMax - xMin)}</Text>
          <Text size="sm">Count: {xValues.length}</Text>
        </Box>
        <Box>
          <Text fw={500}>Y Statistics</Text>
          <Text size="sm">Min: {format(yMin)}</Text>
          <Text size="sm">Max: {format(yMax)}</Text>
          <Text size="sm">Mean: {format(yMean)}</Text>
          <Text size="sm">Range: {format(yMax - yMin)}</Text>
          <Text size="sm">Count: {yValues.length}</Text>
        </Box>
      </Group>
    </Stack>
  );
}

export function PlotViz({ data, name, fullScreen = false, onFullscreen }: PlotVizProps) {
  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('dark');
  const isDark = computedColorScheme === 'dark';
  
  // Plot configuration state
  const [plotType, setPlotType] = useState<string>('scatter');
  const [showMarkers, setShowMarkers] = useState<boolean>(true);
  const [markerSize, setMarkerSize] = useState<number>(6);
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [lineShape, setLineShape] = useState<'linear' | 'spline' | 'hv' | 'vh' | 'hvh' | 'vhv'>('linear');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [controlsOpened, { toggle: toggleControls }] = useDisclosure(false);
  
  // Hover controls state for fullscreen mode
  const [showControls, setShowControls] = useState(false);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-hide controls after a delay when in fullscreen mode
  useEffect(() => {
    if (fullScreen && showControls && controlsTimeout.current === null) {
      controlsTimeout.current = setTimeout(() => {
        setShowControls(false);
        controlsTimeout.current = null;
      }, 3000);
    }
    
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
        controlsTimeout.current = null;
      }
    };
  }, [showControls, fullScreen]);
  
  // Mouse move handler to show controls in fullscreen mode
  const handleMouseMove = () => {
    if (fullScreen) {
      setShowControls(true);
      
      // Reset the auto-hide timer
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
        controlsTimeout.current = null;
      }
    }
  };
  
  // Format data for Plotly
  const chartData = useMemo(() => {
    return data.data_x.map(point => ({
      x: point[0],
      y: point[1]
    }));
  }, [data]);
  
  // Configure plot data
  const plotData: Plotly.Data[] = [
    {
      x: chartData.map(point => point.x),
      y: chartData.map(point => point.y),
      type: plotType === 'bar' ? 'bar' : 'scatter',
      mode: plotType === 'scatter' 
        ? (showMarkers ? (lineWidth > 0 ? 'lines+markers' : 'markers') : 'lines')
        : undefined,
      marker: {
        size: markerSize,
        color: theme.colors[theme.primaryColor][isDark ? 4 : 6]
      },
      line: {
        width: lineWidth,
        shape: lineShape,
        color: theme.colors[theme.primaryColor][isDark ? 4 : 6]
      },
      name: name
    }
  ];
  
  // Configure plot layout
  const plotLayout: Partial<Plotly.Layout> = {
    autosize: true,
    title: fullScreen ? name : '',
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      color: isDark ? theme.colors.gray[4] : theme.colors.gray[7]
    },
    margin: {
      l: 50,
      r: 20,
      t: fullScreen ? 30 : 10,
      b: 50
    },
    xaxis: {
      title: 'X Axis',
      showgrid: showGrid,
      gridcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      zeroline: true,
      zerolinecolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
    },
    yaxis: {
      title: 'Y Axis',
      showgrid: showGrid,
      gridcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      zeroline: true,
      zerolinecolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
    }
  };
  
  // Configure plot config
  const plotConfig: Partial<Plotly.Config> = {
    responsive: true,
    displayModeBar: fullScreen,
    scrollZoom: true,
    toImageButtonOptions: {
      format: 'png',
      filename: `${name}_plot`,
      height: 800,
      width: 1200,
      scale: 2
    }
  };
  
  // Plot control panel
  const plotControls = (
    <Collapse in={controlsOpened}>
      <Stack gap="md" my="md">
        <Group>
          <Select
            label="Plot Type"
            value={plotType}
            onChange={(value) => setPlotType(value || 'scatter')}
            data={[
              { value: 'scatter', label: 'Line/Scatter' },
              { value: 'bar', label: 'Bar Chart' }
            ]}
            style={{ width: '140px' }}
          />
          
          {plotType === 'scatter' && (
            <>
              <Switch
                label="Show Markers"
                checked={showMarkers}
                onChange={(e) => setShowMarkers(e.currentTarget.checked)}
              />
              
              {showMarkers && (
                <NumberInput
                  label="Marker Size"
                  value={markerSize}
                  onChange={(val) => setMarkerSize(Number(val))}
                  min={1}
                  max={20}
                  style={{ width: '120px' }}
                />
              )}
            </>
          )}
        </Group>
        
        <Group>
          {plotType === 'scatter' && (
            <>
              <NumberInput
                label="Line Width"
                value={lineWidth}
                onChange={(val) => setLineWidth(Number(val))}
                min={0}
                max={10}
                style={{ width: '120px' }}
              />
              
              <Select
                label="Line Shape"
                value={lineShape}
                onChange={(value) => setLineShape((value || 'linear') as 'linear' | 'spline' | 'hv' | 'vh' | 'hvh' | 'vhv')}
                data={[
                  { value: 'linear', label: 'Linear' },
                  { value: 'spline', label: 'Spline' },
                  { value: 'hv', label: 'Step (H-V)' },
                  { value: 'vh', label: 'Step (V-H)' }
                ]}
                style={{ width: '140px' }}
              />
            </>
          )}
          
          <Switch
            label="Show Grid"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.currentTarget.checked)}
          />
        </Group>
      </Stack>
    </Collapse>
  );
  
  // Plot content
  const plotContent = (
    <div style={{ width: '100%', height: fullScreen ? '100%' : 300 }}>
      <Plot
        data={plotData}
        layout={plotLayout}
        config={plotConfig}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
  
  // Create download/export data function
  const exportToCSV = () => {
    if (chartData.length === 0) return;
    
    const csvContent = [
      "x,y",
      ...chartData.map(point => `${point.x},${point.y}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${name}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // For full screen mode with hovering controls
  if (fullScreen) {
    return (
      <Box style={{ height: '100%', width: '100%', position: 'relative' }} onMouseMove={handleMouseMove}>
        {/* Floating controls that appear on hover */}
        <Transition mounted={showControls} transition="fade" duration={200}>
          {(styles) => (
            <Box
              style={{
                ...styles,
                position: 'absolute',
                bottom: 10,
                left: 0,
                right: 0,
                zIndex: 100,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Paper 
                p="xs" 
                radius="md" 
                style={{ 
                  opacity: 0.9, 
                  backdropFilter: 'blur(4px)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  maxWidth: '90%',
                }}
              >
                <Group>
                  <Tooltip label="Configure Plot">
                    <Button 
                      onClick={toggleControls} 
                      variant="subtle"
                      leftSection={<IconAdjustments size={16} />}
                      size="sm"
                    >
                      Settings
                    </Button>
                  </Tooltip>
                  
                  <Tooltip label="Download Data">
                    <Button 
                      onClick={exportToCSV} 
                      variant="subtle" 
                      leftSection={<IconDownload size={16} />}
                      size="sm"
                    >
                      Export
                    </Button>
                  </Tooltip>
                </Group>
                {plotControls}
              </Paper>
            </Box>
          )}
        </Transition>
        
        {plotContent}
      </Box>
    );
  }
  
  // For dashboard/card view
  return (
    <Card shadow="sm" p="lg" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Title order={4}>{name}</Title>
          <Group gap="xs">
            <Badge>{chartData.length} points</Badge>
            {onFullscreen && (
              <Tooltip label="View Fullscreen">
                <Button
                  onClick={onFullscreen}
                  variant="subtle"
                >
                  <IconMaximize size={16} />
                </Button>
              </Tooltip>
            )}
          </Group>
        </Group>
      </Card.Section>
      
      {plotContent}
      
      <Group mt="md" justify="space-between">
        <Button 
          onClick={toggleControls} 
          variant="light" 
          leftSection={<IconAdjustments size={16} />}
          size="sm"
        >
          Configure
        </Button>
        
        <Button 
          onClick={exportToCSV} 
          variant="light" 
          leftSection={<IconDownload size={16} />}
          size="sm"
        >
          Export Data
        </Button>
      </Group>
      
      {plotControls}
      
      {chartData.length > 0 && (
        <Card.Section withBorder inheritPadding pt="md" mt="md">
          <StatsSummary data={chartData} />
        </Card.Section>
      )}
    </Card>
  );
} 