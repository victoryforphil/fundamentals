import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket, Viz } from '../context/WebSocketContext';
import { PlotViz } from './PlotViz';
import { ThreeDViz } from './ThreeDViz';
import {
  Box,
  ActionIcon,
  Text,
  Stack,
  Group,
  Tooltip,
  Loader,
  Center,
  Paper,
  useComputedColorScheme,
  useMantineColorScheme,
  Transition
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
      variant="subtle" 
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
  const { messages } = useWebSocket();
  const [viz, setViz] = useState<Viz | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-hide controls after a delay
  useEffect(() => {
    if (showControls && controlsTimeout.current === null) {
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
  }, [showControls]);
  
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

  // Mouse move handler to show controls
  const handleMouseMove = () => {
    setShowControls(true);
    
    // Reset the auto-hide timer
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
      controlsTimeout.current = null;
    }
  };

  // If we don't have a valid visualization yet
  if (notFound) {
    return (
      <Box style={{ height: '100vh' }}>
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
      <Box style={{ height: '100vh' }} onMouseMove={handleMouseMove}>
        {/* Floating controls that appear on hover */}
        <Transition mounted={showControls} transition="fade" duration={200}>
          {(styles) => (
            <Box
              style={{
                ...styles,
                position: 'absolute',
                top: 10,
                left: 10,
                zIndex: 100,
              }}
            >
              <Paper 
                p="xs" 
                radius="md" 
                style={{ 
                  opacity: 0.9, 
                  backdropFilter: 'blur(4px)',
                  background: 'rgba(0, 0, 0, 0.5)', 
                  maxWidth: '300px',
                }}
              >
                <Group>
                  <Tooltip label="Go back to dashboard">
                    <ActionIcon onClick={goBack} variant="subtle" size="md">
                      <IconArrowLeft size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Text size="sm" c="dimmed" truncate>
                    {viz.name}
                  </Text>
                  <ThemeToggle />
                </Group>
              </Paper>
            </Box>
          )}
        </Transition>

        {viz.widgets.length > 0 ? (
          <Box style={{ height: '100vh' }}>
            {renderFullScreenPlot(viz)}
          </Box>
        ) : (
          <Center style={{ height: '100%' }}>
            <Text>No plot data available in this visualization.</Text>
          </Center>
        )}
      </Box>
    );
  }

  // Loading state - but still don't block the UI
  return (
    <Box style={{ height: '100vh' }}>
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
      <Box style={{ height: '100%' }}>
        <PlotViz 
          data={widget.plot_scalar} 
          name={viz.name} 
          fullScreen={true}
        />
      </Box>
    );
  }
  
  if (widget['3d_view']) {
    return (
      <Box style={{ height: '100%' }}>
        <ThreeDViz 
          data={widget['3d_view']} 
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