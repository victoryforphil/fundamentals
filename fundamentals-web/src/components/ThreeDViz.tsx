import { useState, useRef, useEffect } from 'react';
import { ThreeDViewData } from '../context/WebSocketContext';
import { 
  Card, 
  Title, 
  Stack, 
  Group, 
  Badge,
  Button,
  Collapse,
  NumberInput,
  Select,
  useMantineTheme, 
  useComputedColorScheme,
  Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { IconMaximize, IconAdjustments } from '@tabler/icons-react';
import * as THREE from 'three';

interface ThreeDVizProps {
  data: ThreeDViewData;
  name: string;
  fullScreen?: boolean;
  onFullscreen?: () => void;
}

// The Points component to render the point cloud
function PointCloud({ points, color, size = 0.05 }: { points: [number, number, number][]; color: string; size?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  useFrame(() => {
    if (pointsRef.current) {
      // Optional animation, e.g., slow rotation
      pointsRef.current.rotation.y += 0.001;
    }
  });

  // Create a geometry with the points
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array(points.flatMap(point => point));
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry attach="geometry" {...geometry} />
      <pointsMaterial
        attach="material"
        color={color}
        size={size}
        sizeAttenuation
      />
    </points>
  );
}

// Scene setup component
function Scene({ data, color, pointSize }: { data: ThreeDViewData; color: string; pointSize: number }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <OrbitControls enableDamping dampingFactor={0.1} />
      
      {data.primatives.map(([_intensity, primitive], index) => {
        if ('Point' in primitive) {
          return (
            <PointCloud 
              key={index} 
              points={primitive.Point} 
              color={color}
              size={pointSize * 0.05} 
            />
          );
        }
        return null;
      })}
    </>
  );
}

export function ThreeDViz({ data, name, fullScreen = false, onFullscreen }: ThreeDVizProps) {
  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('dark');
  const isDark = computedColorScheme === 'dark';
  
  // State for controls
  const [pointSize, setPointSize] = useState<number>(3);
  const [backgroundColor, setBackgroundColor] = useState<string>(
    isDark ? '#1A1B1E' : '#ffffff'
  );
  const [pointColor, setPointColor] = useState<string>(
    theme.colors[theme.primaryColor][isDark ? 4 : 6]
  );
  const [controlsOpened, { toggle: toggleControls }] = useDisclosure(false);
  
  // Update background color when theme changes
  useEffect(() => {
    setBackgroundColor(isDark ? '#1A1B1E' : '#ffffff');
    setPointColor(theme.colors[theme.primaryColor][isDark ? 4 : 6]);
  }, [isDark, theme]);
  
  // 3D Controls panel
  const vizControls = (
    <Collapse in={controlsOpened}>
      <Stack gap="md" my="md">
        <Group>
          <NumberInput
            label="Point Size"
            value={pointSize}
            onChange={(val) => setPointSize(Number(val))}
            min={1}
            max={20}
            style={{ width: '120px' }}
          />
          
          <Select
            label="Point Color"
            value={pointColor}
            onChange={(value) => setPointColor(value || theme.colors[theme.primaryColor][isDark ? 4 : 6])}
            data={Object.keys(theme.colors).map(colorName => ({
              value: theme.colors[colorName][isDark ? 4 : 6],
              label: colorName
            }))}
            style={{ width: '140px' }}
          />
        </Group>
      </Stack>
    </Collapse>
  );
  
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Title order={4}>{name}</Title>
        <Group gap="xs">
          <Badge color="blue">3D</Badge>
          <Tooltip label="Adjust Settings">
            <Button variant="subtle" size="sm" onClick={toggleControls}>
              <IconAdjustments size={16} />
            </Button>
          </Tooltip>
          {!fullScreen && onFullscreen && (
            <Tooltip label="View Fullscreen">
              <Button variant="subtle" size="sm" onClick={onFullscreen}>
                <IconMaximize size={16} />
              </Button>
            </Tooltip>
          )}
        </Group>
      </Group>
      
      {vizControls}
      
      <div style={{ 
        width: '100%', 
        height: fullScreen ? 'calc(95vh - 150px)' : '300px',
        borderRadius: theme.radius.md,
        overflow: 'hidden'
      }}>
        <Canvas style={{ background: backgroundColor }}>
          <Scene data={data} color={pointColor} pointSize={pointSize} />
        </Canvas>
      </div>
    </Card>
  );
} 