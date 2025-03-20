import { useState, useRef, useEffect } from 'react';
import { ThreeDViewData, ThreeDPrimitive } from '../context/WebSocketContext';
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
  Slider,
  Text,
  useMantineTheme, 
  useComputedColorScheme,
  Tooltip,
  Switch
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import { IconMaximize, IconAdjustments, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import * as THREE from 'three';

interface ThreeDVizProps {
  data: ThreeDViewData;
  name: string;
  fullScreen?: boolean;
  onFullscreen?: () => void;
}

// Custom gradient background
function GradientBackground() {
  const { gl } = useThree();
  const computedColorScheme = useComputedColorScheme('dark');
  const isDark = computedColorScheme === 'dark';
  
  useEffect(() => {
    // Create gradient colors - dark blues for dark mode, light for light mode
    const color1 = isDark ? new THREE.Color('#000420') : new THREE.Color('#e6f0ff');
    const color2 = isDark ? new THREE.Color('#000000') : new THREE.Color('#ffffff');
    
    gl.setClearColor(color1, 1);
    
    // Create a scene for the gradient background
    const scene = new THREE.Scene();
    
    // Create a plane geometry that covers the viewport
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    // Create a shader material with gradient
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color1: { value: color1 },
        color2: { value: color2 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        void main() {
          gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
        }
      `,
      depthWrite: false
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    // Store the original clear function
    const originalClearFunc = gl.clearDepth;
    
    // Override the clear function to render our gradient first
    gl.autoClear = false;
    
    return () => {
      // Restore original behavior on cleanup
      gl.autoClear = true;
      gl.clearDepth = originalClearFunc;
    };
  }, [gl, isDark]);
  
  return null;
}

// Improved lighting setup
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.6} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.2} />
      <hemisphereLight groundColor="#000000" intensity={0.3} />
      <spotLight position={[0, 10, 0]} intensity={0.5} castShadow angle={0.5} penumbra={1} />
    </>
  );
}

// The Points component to render the point cloud
function PointCloud({ points, color, size = 0.05, opacity = 1.0 }: { 
  points: [number, number, number][]; 
  color: string; 
  size?: number;
  opacity?: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);

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
        transparent={opacity < 1.0}
        opacity={opacity}
      />
    </points>
  );
}

// Scene setup component
function Scene({ data, color, pointSize, timeIndex, showTrails, trailCount }: { 
  data: ThreeDViewData; 
  color: string; 
  pointSize: number;
  timeIndex: number;
  showTrails: boolean;
  trailCount: number;
}) {
  // Get all time values
  const timeValues = data.primatives.map(([time]) => time).sort((a, b) => a - b);
  
  // Find the index of the current timeIndex in the sorted array
  const currentTimeValueIndex = timeValues.findIndex(t => t > timeIndex) - 1;
  
  // If showing only latest points, filter to just the current time
  let visiblePrimitives: [number, ThreeDPrimitive][] = [];
  
  if (showTrails) {
    // Get the last N time points up to the current time
    const startIndex = Math.max(0, currentTimeValueIndex - trailCount + 1);
    const relevantTimeValues = timeValues.slice(startIndex, currentTimeValueIndex + 1);
    
    // Filter primitives to only include those with times in our relevant set
    visiblePrimitives = data.primatives.filter(([time]) => 
      relevantTimeValues.includes(time) && time <= timeIndex
    ) as [number, ThreeDPrimitive][];
  } else {
    // Just show the latest point at or before timeIndex
    const latestTime = timeValues.filter(t => t <= timeIndex).pop();
    if (latestTime !== undefined) {
      visiblePrimitives = data.primatives.filter(([time]) => time === latestTime) as [number, ThreeDPrimitive][];
    }
  }
  
  return (
    <>
      <GradientBackground />
      <Lighting />
      <PerspectiveCamera makeDefault position={[0, 2, 5]} />
      <OrbitControls enableDamping dampingFactor={0.1} />
      
      {/* Grid helper */}
      <Grid 
        infiniteGrid 
        cellSize={0.5}
        cellThickness={0.5}
        sectionSize={3}
        sectionThickness={1}
        fadeDistance={35}
      />
      
      {visiblePrimitives.map(([time, primitive], index) => {
        if ('Point' in primitive) {
          // Calculate opacity based on how recent the point is
          const timePosition = timeValues.indexOf(time);
          const latestTimePosition = currentTimeValueIndex;
          const opacityFactor = showTrails 
            ? 0.3 + 0.7 * ((timePosition - (latestTimePosition - trailCount + 1)) / (trailCount - 1))
            : 1.0;
          
          return (
            <PointCloud 
              key={`${index}-${time}`} 
              points={primitive.Point} 
              color={color}
              size={pointSize * 0.05}
              opacity={Math.max(0.3, opacityFactor)}
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
  const [pointColor, setPointColor] = useState<string>(
    theme.colors[theme.primaryColor][isDark ? 4 : 6]
  );
  const [controlsOpened, { toggle: toggleControls }] = useDisclosure(false);
  
  // Timeline control
  const [timeIndex, setTimeIndex] = useState<number>(0);
  const [maxTimeIndex, setMaxTimeIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const animationRef = useRef<number | null>(null);
  
  // Trail controls
  const [showTrails, setShowTrails] = useState<boolean>(false);
  const [trailCount, setTrailCount] = useState<number>(5);
  
  // Update colors when theme changes
  useEffect(() => {
    setPointColor(theme.colors[theme.primaryColor][isDark ? 4 : 6]);
  }, [isDark, theme]);
  
  // Calculate min and max time values from data
  useEffect(() => {
    if (data.primatives.length > 0) {
      const timeValues = data.primatives.map(([time]) => time);
      setMaxTimeIndex(Math.max(...timeValues));
      
      // If timeIndex is not set yet, set it to the max
      if (timeIndex === 0) {
        setTimeIndex(Math.max(...timeValues));
      }
    }
  }, [data.primatives]);
  
  // Animation loop for timeline playback
  useEffect(() => {
    if (isPlaying) {
      let startTime = performance.now();
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        
        // Update every 100ms
        if (elapsed > 100) {
          setTimeIndex(prev => {
            // Reset to 0 if we've reached the end
            if (prev >= maxTimeIndex) {
              return 0;
            }
            // Find the next available time index
            const timeValues = data.primatives.map(([time]) => time).sort((a, b) => a - b);
            const nextIndex = timeValues.find(t => t > prev) || 0;
            return nextIndex;
          });
          startTime = currentTime;
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, maxTimeIndex, data.primatives]);
  
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
        
        <Group>
          <Switch
            label="Show Trails"
            checked={showTrails}
            onChange={(event) => setShowTrails(event.currentTarget.checked)}
          />
          
          {showTrails && (
            <NumberInput
              label="Trail Count"
              value={trailCount}
              onChange={(val) => setTrailCount(Number(val))}
              min={2}
              max={20}
              style={{ width: '120px' }}
            />
          )}
        </Group>
      </Stack>
    </Collapse>
  );
  
  // Timeline controls
  const timelineControls = (
    <Stack gap="xs" mt="md">
      <Group justify="space-between">
        <Text size="sm" fw={500}>Timeline</Text>
        <Text size="xs" c="dimmed">{timeIndex.toFixed(2)}</Text>
      </Group>
      
      <Group>
        <Button 
          variant="subtle" 
          size="xs" 
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
        </Button>
        
        <Slider
          style={{ flex: 1 }}
          value={timeIndex}
          onChange={setTimeIndex}
          min={0}
          max={maxTimeIndex}
          step={0.01}
          label={null}
        />
      </Group>
    </Stack>
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
        height: fullScreen ? 'calc(80vh - 200px)' : '300px',
        borderRadius: theme.radius.md,
        overflow: 'hidden'
      }}>
        <Canvas>
          <Scene 
            data={data} 
            color={pointColor} 
            pointSize={pointSize} 
            timeIndex={timeIndex}
            showTrails={showTrails}
            trailCount={trailCount}
          />
        </Canvas>
      </div>
      
      {timelineControls}
    </Card>
  );
} 