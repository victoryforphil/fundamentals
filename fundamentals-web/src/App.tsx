import { useEffect, useState } from 'react';
import { MantineProvider, AppShell, Flex, Title, Text, Group, Menu, ActionIcon, useComputedColorScheme, useMantineColorScheme, Center, Loader, Stack, Paper } from '@mantine/core';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';
import FullScreenPlot from './components/FullScreenPlot';
import Dashboard from './components/Dashboard';
import { theme } from './theme'
import { IconSettings, IconSun, IconMoon } from '@tabler/icons-react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/code-highlight/styles.css';

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
      size="lg" 
      aria-label="Toggle color scheme"
    >
      {computedColorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  );
}

// Layout component for the dashboard view
function DashboardLayout() {
  const [, setWsParam] = useState<string | null>(null);
  const location = useLocation();

  // Get the current WebSocket URL parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setWsParam(params.get('ws'));
  }, [location]);

  // Helper to create a URL with a new WebSocket parameter
  const createWsUrl = (wsUrl: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('ws', wsUrl);
    return url.toString();
  };

  return (
    <AppShell header={{ height: 50 }}>
      <AppShell.Header p="md">
        <Flex align="center" justify="space-between">
          <Group>
            <Title order={2}>Fundamentals</Title>
          </Group>
          
          <Group>
            <ThemeToggle />
            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <ActionIcon size="sm" variant="light">
                  <IconSettings size={18} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>WebSocket Connections</Menu.Label>
                <Menu.Item component="a" href={createWsUrl('ws://localhost:3031/ws')}>
                  Default (localhost:3031)
                </Menu.Item>
                <Menu.Item component="a" href={createWsUrl('ws://127.0.0.1:3031/ws')}>
                  Local IP (127.0.0.1:3031)
                </Menu.Item>
                <Menu.Divider />
                <Menu.Label>Custom</Menu.Label>
                <Menu.Item component="a" href="/">
                  Reset to Default
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Flex>
      </AppShell.Header>
      
      <AppShell.Main pt={85}>
        <Dashboard />
      </AppShell.Main>
    </AppShell>
  );
}

// Component to handle auto-routing to the latest recording
function AutoRouter() {
  const navigate = useNavigate();
  const { messages, isConnected } = useWebSocket();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Set a timeout to show loading state for at least 1 second
    const timer = setTimeout(() => {
      if (messages.length > 0) {
        // Get the latest viz (recording)
        const latestViz = messages[messages.length - 1];
        
        // Check if it has widgets
        if (latestViz.widgets.length > 0) {
          // Determine the widget type from the first widget
          const firstWidget = latestViz.widgets[0];
          
          // Use the appropriate route based on the widget type
          if ('plot_scalar' in firstWidget) {
            navigate(`/plot_scalar/${messages.length - 1}`);
          } else if ('3d_view' in firstWidget) {
            navigate(`/3d_view/${messages.length - 1}`);
          } else {
            // Default to dashboard if widget type is unknown
            navigate('/dashboard');
          }
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [messages, navigate]);
  
  // Show a nice loading screen while waiting for data
  return (
    <Center style={{ height: '100vh' }}>
      <Paper p="xl" radius="md" shadow="sm" withBorder>
        <Stack align="center" gap="lg">
          <Title order={2}>Fundamentals</Title>
          <Loader size="xl" type="dots" />
          {loading ? (
            <Title order={4}>Waiting for visualizations...</Title>
          ) : (
            <Stack align="center" gap="sm">
              <Title order={4}>No visualizations found</Title>
              <ActionIcon 
                size="lg" 
                variant="filled" 
                color="blue" 
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </ActionIcon>
            </Stack>
          )}
          <Center>
            <div style={{ position: 'relative', top: '10px' }}>
              {isConnected ? (
                <Title order={6} c="green">Connected</Title>
              ) : (
                <Title order={6} c="red">Disconnected - Reconnecting...</Title>
              )}
            </div>
          </Center>
        </Stack>
      </Paper>
    </Center>
  );
}

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <WebSocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AutoRouter />} />
            <Route path="/dashboard" element={<DashboardLayout />} />
            <Route path="/plot_scalar/:vizIndex" element={<FullScreenPlot />} />
            <Route path="/3d_view/:vizIndex" element={<FullScreenPlot />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </MantineProvider>
  );
}

export default App;
