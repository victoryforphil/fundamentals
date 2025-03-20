import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';

// Define the data types based on recording.json structure
export interface PlotScalarData {
  data_x: [number, number][];
  type?: string; // Add type property for use in UI components
}

// Define the 3D view data types based on three_d_view.rs
export interface ThreeDPoint {
  points: [number, number, number][];
}

export interface ThreeDViewData {
  primatives: [number, ThreeDPrimitive][];
}

export type ThreeDPrimitive = {
  Point: [number, number, number][];
}

export interface PlotWidget {
  plot_scalar?: PlotScalarData;
  '3d_view'?: ThreeDViewData;
}

// Define the Viz type based on what's coming from the backend
export interface Viz {
  name: string;
  source: string | null;
  widgets: PlotWidget[];
  range: Record<string, unknown> | null;
}

// Define the message type from the Rust backend
export interface WSMessage {
  VizUpdate: Viz;
}

interface WebSocketContextType {
  isConnected: boolean;
  messages: Viz[];
  error: string | null;
  connectionUrl: string;
  clearMessages: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

// Helper function to get WebSocket URL from params or use default
function getWebSocketUrl() {
  // Get URL parameters
  const params = new URLSearchParams(window.location.search);
  const wsUrl = params.get('ws');

  // Default to localhost:3031 if not provided
  return wsUrl || 'ws://localhost:3031/ws';
}

interface WebSocketProviderProps {
  children: ReactNode;
  defaultUrl?: string;
}

export function WebSocketProvider({ 
  children, 
  defaultUrl = getWebSocketUrl() 
}: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Viz[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connectionUrl, setConnectionUrl] = useState(defaultUrl);
  const reconnectTimer = useRef<number | undefined>(undefined);
  const reconnectAttempts = useRef(0);

  // Function to clear all messages
  const clearMessages = () => {
    setMessages([]);
  };

  // Internal function to establish connection
  function connect(url: string) {
    // Close any existing connection
    if (socket) {
      socket.close();
    }

    try {
      const newSocket = new WebSocket(url);
      setConnectionUrl(url);
      setSocket(newSocket);

      newSocket.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        console.log('WebSocket connected to', url);
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSMessage;
          // Based on the ws_handler.rs, messages are of type VizUpdate
          if ('VizUpdate' in data) {
            setMessages((prev) => [...prev, data.VizUpdate]);
            console.log('Received viz update:', data.VizUpdate);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      newSocket.onerror = (e) => {
        console.error('WebSocket error:', e);
        setError('WebSocket connection error');
      };

      newSocket.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
        // Always try to reconnect, regardless if we've connected before
        scheduleReconnect(url);
      };

    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      setError(`Failed to connect: ${err}`);
      setIsConnected(false);
      // Always try to reconnect on error
      scheduleReconnect(url);
    }
  }
  
  // Schedule a reconnection attempt with exponential backoff
  function scheduleReconnect(url: string) {
    if (reconnectTimer.current) {
      window.clearTimeout(reconnectTimer.current);
    }
    
    // Calculate backoff time: start with 250ms, max at 5s
    const backoffTime = Math.min(250 * Math.pow(1.5, reconnectAttempts.current), 5000);
    reconnectAttempts.current += 1;
    
    reconnectTimer.current = window.setTimeout(() => {
      console.log(`Attempting to reconnect (attempt ${reconnectAttempts.current})...`);
      connect(url);
    }, backoffTime);
  }

  // Initial connection and cleanup
  useEffect(() => {
    connect(connectionUrl);

    // Cleanup function to close the connection when component unmounts
    return () => {
      if (reconnectTimer.current) {
        window.clearTimeout(reconnectTimer.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Context value with only the necessary properties for components
  const value = {
    isConnected,
    messages,
    error,
    connectionUrl,
    clearMessages
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
} 