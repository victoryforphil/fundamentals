import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket, Viz, PlotWidget } from '../context/WebSocketContext';
import { PlotScalarViz } from './PlotScalarViz';
import {
  Box,
  ActionIcon,
  Title,
  Text,
  Stack,
  Group,
  Tooltip,
  Loader,
  Center,
  Paper,
  useComputedColorScheme,
  useMantineColorScheme
} from '@mantine/core';
import { IconArrowLeft, IconReload, IconMaximize, IconSun, IconMoon } from '@tabler/icons-react';

// Theme toggle component
function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('dark');
  
  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ActionIcon 
      onClick={toggleColorScheme} 
      variant="light" 
      size="md" 
      aria-label="Toggle color scheme"
    >
      {computedColorScheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
    </ActionIcon>
  );
}

export default function FullScreenPlot() {
  const { vizIndex } = useParams<{ vizIndex: string }>();
  const navigate = useNavigate();
  const { messages, isConnected } = useWebSocket();
  const [viz, setViz] = useState<Viz | null>(null);
  
  useEffect(() => {
    if (messages.length > 0 && vizIndex) {
      const index = parseInt(vizIndex, 10);
      if (!isNaN(index) && index >= 0 && index < messages.length) {
        setViz(messages[index]);
      }
    }
  }, [messages, vizIndex]);

  // Function to navigate back to the main page
  const goBack = () => navigate('/');

  // If we don't have a valid visualization yet
  if (!viz) {
    return (
      <Center style={{ height: '100vh' }}>
        {isConnected ? (
          <Stack align="center" gap="md">
            <Loader size="xl" />
            <Text>Loading visualization data...</Text>
            <ActionIcon variant="light" onClick={goBack}>
              <IconArrowLeft />
            </ActionIcon>
          </Stack>
        ) : (
          <Stack align="center" gap="md">
            <Text>No visualization data available. Please check your connection.</Text>
            <ActionIcon variant="filled" onClick={goBack}>
              <IconArrowLeft />
            </ActionIcon>
          </Stack>
        )}
      </Center>
    );
  }

  return (
    <Box style={{ height: '100vh', padding: '16px' }}>
      <Paper p="sm" withBorder mb="md">
        <Group justify="space-between">
          <Group>
            <Tooltip label="Back to Dashboard">
              <ActionIcon onClick={goBack} variant="light">
                <IconArrowLeft size={18} />
              </ActionIcon>
            </Tooltip>
            <Title order={3}>{viz.name}</Title>
          </Group>
          <Group>
            <Text size="sm" c="dimmed">
              Visualization {parseInt(vizIndex || '0', 10) + 1} of {messages.length}
            </Text>
            <ThemeToggle />
          </Group>
        </Group>
      </Paper>

      {viz.widgets.length > 0 ? (
        <Box style={{ height: 'calc(100vh - 100px)' }}>
          {renderFullScreenPlot(viz)}
        </Box>
      ) : (
        <Center style={{ height: 'calc(100vh - 100px)' }}>
          <Text>No plot data available in this visualization.</Text>
        </Center>
      )}
    </Box>
  );
}

// Function to render the appropriate plot type in full screen
function renderFullScreenPlot(viz: Viz) {
  // For now, we'll just render the first widget as full screen
  // This could be enhanced to handle different plot types
  const widget = viz.widgets[0];
  
  if (widget.PlotScalar) {
    return (
      <Box style={{ height: '100%', padding: '16px' }}>
        <PlotScalarViz 
          data={widget.PlotScalar} 
          name={viz.name} 
          fullScreen={true}
        />
      </Box>
    );
  }
  
  // Fallback
  return (
    <Center style={{ height: '100%' }}>
      <Text>Unsupported visualization type for full screen.</Text>
    </Center>
  );
} 