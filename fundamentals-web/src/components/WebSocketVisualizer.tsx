import { useWebSocket, Viz, PlotScalarData } from '../context/WebSocketContext';
import { PlotScalarViz } from './PlotScalarViz';
import { Link } from 'react-router-dom';
import {
  Paper,
  Text,
  Group,
  Badge,
  Stack,
  Title,
  Card,
  Accordion,
  ScrollArea,
  Code,
  Box,
  Divider,
  Grid,
  Tabs,
  Tooltip,
  ActionIcon,
  SegmentedControl,
  Button,
  SimpleGrid
} from '@mantine/core';
import { 
  IconPlug, 
  IconPlugConnected, 
  IconPlugConnectedX, 
  IconChartLine, 
  IconListDetails, 
  IconTrash,
  IconMaximize,
  IconChevronUp,
  IconChevronDown
} from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CodeHighlight } from '@mantine/code-highlight';
import { JsonTree } from '@mantine/json-tree';

// Simple JSON renderer as fallback if @mantine/json-tree is not available
const JsonRenderer = ({ data, isExpanded }: { data: any, isExpanded: boolean }) => (
  <Box component="pre" style={{ maxHeight: isExpanded ? undefined : 200, overflow: 'auto' }}>
    {JSON.stringify(data, null, 2)}
  </Box>
);

// Add this interface to handle the updated message format with parsed data
interface WebSocketMessage {
  id: string;
  data: string;
  parsedMessage?: PlotScalarData;
  timestamp: number;
}

export function WebSocketVisualizer() {
  const { messages: vizMessages, isConnected, clearMessages } = useWebSocket();
  const [selectedView, setSelectedView] = useState<'raw' | 'parsed'>('parsed');
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const { pathname } = useLocation();
  const navigate = useNavigate();
  
  // Transform Viz objects to WebSocketMessage format with unique IDs
  const messages = useMemo<WebSocketMessage[]>(() => {
    return vizMessages.map((viz, index) => {
      // This is a simple transformation - adapt based on your actual data structure
      const messageId = `msg-${index}`;
      
      // Check if the first widget is a PlotScalar and use it as parsedMessage
      let parsedMessage: PlotScalarData | undefined;
      if (viz.widgets.length > 0 && viz.widgets[0].PlotScalar) {
        parsedMessage = viz.widgets[0].PlotScalar;
        parsedMessage.type = 'scalar_plot'; // Add type field
      }
      
      return {
        id: messageId,
        data: JSON.stringify(viz, null, 2),
        parsedMessage,
        timestamp: Date.now() - (vizMessages.length - index) * 1000 // For demo
      };
    });
  }, [vizMessages]);
  
  // Function to toggle message expansion
  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Function to clear all messages
  const handleClearMessages = () => {
    clearMessages();
  };

  // Filter messages to get only scalar plots
  const scalarPlots = useMemo(() => {
    return messages.filter(msg => 
      msg.parsedMessage && 
      msg.parsedMessage.type === 'scalar_plot'
    );
  }, [messages]);

  // Handle plot click for full screen view
  const handlePlotClick = (index: number) => {
    navigate(`/plot/${index}`);
  };

  // Check if we're in a route that shouldn't display the visualizer
  const shouldHideVisualizer = pathname.startsWith('/plot/');
  
  if (shouldHideVisualizer) {
    return null;
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" mb="xs">
        <Title order={2}>WebSocket Visualizer</Title>
        <Group>
          <SegmentedControl
            value={selectedView}
            onChange={(value) => setSelectedView(value as 'raw' | 'parsed')}
            data={[
              { label: 'Parsed View', value: 'parsed' },
              { label: 'Raw JSON', value: 'raw' },
            ]}
          />
          <Button 
            variant="light" 
            color="red" 
            onClick={handleClearMessages}
            leftSection={<IconTrash size={16} />}
          >
            Clear
          </Button>
        </Group>
      </Group>

      {messages.length === 0 ? (
        <Card withBorder p="xl" radius="md">
          <Stack align="center" gap="md">
            <IconPlugConnected 
              size={48} 
              style={{ opacity: isConnected ? 1 : 0.5 }} 
              color={isConnected ? 'var(--mantine-color-blue-filled)' : 'var(--mantine-color-gray-filled)'} 
            />
            <Text ta="center" fw={500} size="lg">
              {isConnected 
                ? "Connected. Waiting for messages..." 
                : "Disconnected. Connect to a WebSocket to receive messages."}
            </Text>
          </Stack>
        </Card>
      ) : (
        <>
          {selectedView === 'parsed' && scalarPlots.length > 0 && (
            <>
              <Title order={3} mt="md">Scalar Plots</Title>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                {scalarPlots.map((message, index) => {
                  const plotData = message.parsedMessage as PlotScalarData;
                  return (
                    <Box 
                      key={message.id}
                      onClick={() => handlePlotClick(index)}
                      style={{ cursor: 'pointer' }}
                    >
                      <PlotScalarViz 
                        data={plotData} 
                        name={`Plot ${index + 1}`} 
                      />
                    </Box>
                  );
                })}
              </SimpleGrid>
            </>
          )}

          <Title order={3} mt="md">Message Log</Title>
          <Stack gap="md">
            {messages.map((message) => {
              const isExpanded = !!expandedMessages[message.id];
              
              return (
                <Card key={message.id} withBorder p="sm" radius="md">
                  <Group justify="space-between" mb="xs">
                    <Group>
                      <Badge 
                        color={message.parsedMessage ? 'green' : 'blue'}
                        variant="light"
                      >
                        {message.parsedMessage?.type || 'Raw Data'}
                      </Badge>
                      <Text size="sm" c="dimmed">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Text>
                    </Group>
                    <ActionIcon 
                      variant="subtle"
                      onClick={() => toggleMessageExpansion(message.id)}
                    >
                      {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </ActionIcon>
                  </Group>
                  
                  {selectedView === 'raw' || !message.parsedMessage ? (
                    <CodeHighlight 
                      code={message.data} 
                      language="json"
                      withCopyButton
                      style={{ maxHeight: isExpanded ? undefined : 200, overflow: 'auto' }}
                    />
                  ) : (
                    <Card.Section p="sm">
                      <JsonRenderer 
                        data={message.parsedMessage}
                        isExpanded={isExpanded}
                      />
                    </Card.Section>
                  )}
                </Card>
              );
            })}
          </Stack>
        </>
      )}
    </Stack>
  );
}

// Helper function to render different widget types
function renderWidget(widget: PlotWidget, vizName: string) {
  if (widget.PlotScalar) {
    return <PlotScalarViz data={widget.PlotScalar} name={vizName} />;
  }
  
  // Fallback for unknown widget types
  return (
    <Card withBorder p="md">
      <Text>Unknown widget type</Text>
      <Code block>{JSON.stringify(widget, null, 2)}</Code>
    </Card>
  );
}

interface VizMessageCardProps {
  message: Viz;
  index: number;
}

function RawVizCard({ message, index }: VizMessageCardProps) {
  return (
    <Accordion.Item value={`message-${index}`}>
      <Accordion.Control>
        <Group>
          <Badge>{message.widgets.length} widgets</Badge>
          <Text size="sm" fw={500}>{message.name}</Text>
          <Text size="xs" c="dimmed">#{index + 1}</Text>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Card withBorder>
          <Box mb="md">
            <Divider label="Visualization Data" labelPosition="center" />
          </Box>
          
          <Code block>
            {JSON.stringify(message, null, 2)}
          </Code>
        </Card>
      </Accordion.Panel>
    </Accordion.Item>
  );
} 