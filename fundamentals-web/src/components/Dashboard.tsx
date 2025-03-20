import { useWebSocket } from '../context/WebSocketContext';
import { useNavigate } from 'react-router-dom';
import { PlotViz } from './PlotViz';
import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  Button,
  Group,
  Stack,
  Badge,
  ActionIcon,
  Tooltip,
  useMantineColorScheme,
  useComputedColorScheme,
  Indicator
} from '@mantine/core';
import { 
  IconRefresh, 
  IconSun, 
  IconMoon, 
  IconChartLine,
  IconPlugConnected
} from '@tabler/icons-react';

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { messages, isConnected, clearMessages } = useWebSocket();
  
  // Navigate to full screen plot view
  const viewFullScreen = (index: number) => {
    navigate(`/plot_scalar/${index}`);
  };
  
  return (
    <Container fluid p="xl">
      <Stack gap="md">
        <Group justify="space-between">
          <Group>
            <Title>Fundamentals Dashboard</Title>
            {messages.length > 0 && (
              <Badge size="lg" variant="filled">
                {messages.length} Visualizations
              </Badge>
            )}
          </Group>
          
          <Group>
            <Tooltip label={isConnected ? "WebSocket Connected" : "WebSocket Disconnected - Reconnecting in background..."}>
              <Indicator 
                inline 
                size={12} 
                processing={!isConnected}
                color={isConnected ? "green" : "red"}
                withBorder
              >
                <ActionIcon 
                  variant="light" 
                  aria-label="Connection status"
                  size="md"
                >
                  <IconPlugConnected size={16} color={isConnected ? "green" : "red"} />
                </ActionIcon>
              </Indicator>
            </Tooltip>
            {messages.length > 0 && (
              <Button 
                variant="light" 
                leftSection={<IconRefresh size={16} />}
                onClick={clearMessages}
              >
                Clear All
              </Button>
            )}
            <ThemeToggle />
          </Group>
        </Group>
        
        {messages.length === 0 ? (
          <Card withBorder p="xl" radius="md">
            <Stack align="center" gap="md" style={{ minHeight: '40vh' }} justify="center">
              <IconChartLine size={48} opacity={0.5} />
              <Text size="xl">No visualization data available</Text>
              <Text color="dimmed">
                Run your application to generate plots and visualizations.
              </Text>
              {!isConnected && (
                <Badge color="yellow" variant="light" size="md">
                  WebSocket disconnected - Reconnecting in background...
                </Badge>
              )}
            </Stack>
          </Card>
        ) : (
          <Grid gutter="md">
            {messages.map((viz, index) => (
              viz.widgets.map((widget, widgetIndex) => (
                widget.plot_scalar && (
                  <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={`${index}-${widgetIndex}`}>
                    <div style={{ position: 'relative' }}>
                      <PlotViz 
                        data={widget.plot_scalar} 
                        name={viz.name}
                        onFullscreen={() => viewFullScreen(index)} 
                      />
                    </div>
                  </Grid.Col>
                )
              ))
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
} 