import { useWebSocket } from '../context/WebSocketContext';
import { useNavigate } from 'react-router-dom';
import { PlotViz } from './PlotViz';
import { ThreeDViz } from './ThreeDViz';
import {
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
  Indicator,
  Box
} from '@mantine/core';
import { 
  IconRefresh, 
  IconPlugConnected
} from '@tabler/icons-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { messages, isConnected, clearMessages } = useWebSocket();
  
  // Navigate to full screen plot view
  const viewFullScreen = (index: number, type: string) => {
    navigate(`/${type}/${index}`);
  };
  
  return (
    <Box style={{ height: '100%', padding: '16px 24px' }}>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="md">
            <Title order={3}>Visualizations</Title>
            <Indicator position="top-end" color={isConnected ? "green" : "red"} size={10}>
              <ActionIcon variant="subtle" color={isConnected ? "green" : "red"} size="md">
                <IconPlugConnected size={16} />
              </ActionIcon>
            </Indicator>
            {messages.length > 0 && (
              <Badge variant="light" radius="sm">
                {messages.length} Items
              </Badge>
            )}
          </Group>
          {messages.length > 0 && (
            <Tooltip label="Clear all visualizations">
              <Button 
                leftSection={<IconRefresh size={16} />} 
                onClick={clearMessages} 
                variant="subtle"
                size="sm"
              >
                Clear
              </Button>
            </Tooltip>
          )}
        </Group>
        
        {messages.length === 0 ? (
          <Card shadow="sm" p="xl" radius="md" withBorder style={{ backgroundColor: 'transparent' }}>
            <Stack align="center" gap="md" py="xl">
              <Text size="lg">No visualizations available</Text>
              <Text size="sm" c="dimmed">
                Connect to a data source or run a simulation to see visualizations here.
              </Text>
            </Stack>
          </Card>
        ) : (
          <Grid>
            {messages.map((viz, index) => {
              // Render each visualization based on its type
              const widget = viz.widgets[0]; // Assuming first widget determines type
              
              return (
                <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={index}>
                  <Card shadow="sm" padding={0} radius="md" withBorder mb="md">
                    {widget.plot_scalar ? (
                      <PlotViz 
                        data={widget.plot_scalar} 
                        name={viz.name} 
                        onFullscreen={() => viewFullScreen(index, 'plot_scalar')}
                      />
                    ) : widget['3d_view'] ? (
                      <ThreeDViz 
                        data={widget['3d_view']} 
                        name={viz.name} 
                        onFullscreen={() => viewFullScreen(index, '3d_view')}
                      />
                    ) : (
                      <Card.Section p="md">
                        <Stack>
                          <Group justify="space-between">
                            <Title order={4}>{viz.name}</Title>
                            <Badge color="gray" variant="light">Unknown</Badge>
                          </Group>
                          <Text>Unsupported visualization type</Text>
                        </Stack>
                      </Card.Section>
                    )}
                  </Card>
                </Grid.Col>
              );
            })}
          </Grid>
        )}
      </Stack>
    </Box>
  );
} 