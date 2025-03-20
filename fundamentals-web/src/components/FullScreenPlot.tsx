import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket, Viz } from '../context/WebSocketContext';
import { PlotViz } from './PlotViz';
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
import { IconArrowLeft, IconSun, IconMoon } from '@tabler/icons-react';

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
  const [notFound, setNotFound] = useState(false);
  
  useEffect(() => {
    if (messages.length > 0 && vizIndex) {
      const index = parseInt(vizIndex, 10);
      if (!isNaN(index) && index >= 0 && index < messages.length) {
        setViz(messages[index]);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    } else if (messages.length === 0 && vizIndex && viz === null) {
      // Only set not found if we have no messages and no current viz
      setNotFound(true);
    }
  }, [messages, vizIndex, viz]);

  // Function to navigate back to the main page
  const goBack = () => navigate('/dashboard');

  // Show connection status indicator without blocking the UI
  const ConnectionStatus = () => (
    <Text size="sm" c={isConnected ? "green" : "red"} style={{ position: 'fixed', top: 8, right: 16 }}>
      {isConnected ? "Connected" : "Disconnected - Reconnecting..."}
    </Text>
  );

  // If we don't have a valid visualization yet
  if (notFound) {
    return (
      <Box style={{ height: '100vh', padding: '16px' }}>
        <ConnectionStatus />
        <Center style={{ height: '100%' }}>
          <Stack align="center" gap="md">
            <Text>No visualization data available for this index.</Text>
            <ActionIcon variant="filled" onClick={goBack}>
              <IconArrowLeft />
            </ActionIcon>
          </Stack>
        </Center>
      </Box>
    );
  }

  // If we still have viz data, show it even when disconnected
  if (viz) {
    return (
      <Box style={{ height: '100vh', padding: '16px' }}>
        <ConnectionStatus />
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

  // Loading state - but still don't block the UI
  return (
    <Box style={{ height: '100vh', padding: '16px' }}>
      <ConnectionStatus />
      <Center style={{ height: '100%' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" />
          <Text>Waiting for visualization data...</Text>
          <ActionIcon variant="light" onClick={goBack}>
            <IconArrowLeft />
          </ActionIcon>
        </Stack>
      </Center>
    </Box>
  );
}

// Function to render the appropriate plot type in full screen
function renderFullScreenPlot(viz: Viz) {
  // For now, we'll just render the first widget as full screen
  // This could be enhanced to handle different plot types
  const widget = viz.widgets[0];
  
  if (widget.plot_scalar) {
    return (
      <Box style={{ height: '100%', padding: '16px' }}>
        <PlotViz 
          data={widget.plot_scalar} 
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