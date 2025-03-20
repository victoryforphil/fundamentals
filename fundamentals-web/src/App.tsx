import { useEffect, useState } from 'react';
import { MantineProvider, AppShell, Flex, Container, Title, Text, Group, Menu, ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { WebSocketProvider } from './context/WebSocketContext';
import { WebSocketVisualizer } from './components/WebSocketVisualizer';
import FullScreenPlot from './components/FullScreenPlot';
import { IconSettings, IconSun, IconMoon } from '@tabler/icons-react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
    <AppShell header={{ height: 60 }}>
      <AppShell.Header p="md">
        <Flex align="center" justify="space-between">
          <Group>
            <Title order={2}>Fundamentals Web Viewer</Title>
            <Text c="dimmed">WebSocket Visualization Client</Text>
          </Group>
          
          <Group>
            <ThemeToggle />
            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <ActionIcon size="lg" variant="light">
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
        <Container size="xl">
          <WebSocketVisualizer />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

function App() {
  return (
    <MantineProvider defaultColorScheme="dark">
      <WebSocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/plot/0" replace />} />
            <Route path="/dashboard" element={<DashboardLayout />} />
            <Route path="/plot/:vizIndex" element={<FullScreenPlot />} />
            <Route path="*" element={<Navigate to="/plot/0" replace />} />
          </Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </MantineProvider>
  );
}

export default App;
