import { useWebSocket } from '../context/WebSocketContext';
import { useNavigate } from 'react-router-dom';
import { PlotViz } from './PlotViz';
import { ThreeDViz } from './ThreeDViz';
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
  Indicator
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
    <Container fluid p="xl">
      <Stack gap="md">
        <Group justify="space-between">
          <Group>
            <Title order={3}>Visualizations</Title>
            <Indicator position="top-end" color={isConnected ? "green" : "red"} size={10}>
              <ActionIcon variant="light" color={isConnected ? "green" : "red"} size="md">
                <IconPlugConnected size={16} />
              </ActionIcon>
            </Indicator>
            <Badge>{messages.length} Items</Badge>
          </Group>
          <Group>
            <Tooltip label="Clear all visualizations">
              <Button 
                leftSection={<IconRefresh size={16} />} 
                onClick={clearMessages} 
                variant="light"
                disabled={messages.length === 0}
              >
                Clear
              </Button>
            </Tooltip>
          </Group>
        </Group>
        
        {messages.length === 0 ? (
          <Card withBorder p="xl">
            <Stack align="center" gap="md">
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
                  <Card withBorder p={0} mb="xs">
                    
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
                            <Badge color="gray">Unknown</Badge>
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
    </Container>
  );
} 