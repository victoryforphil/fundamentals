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
  Switch,
  Box,
  Paper,
  Transition,
  Flex,
  ActionIcon
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Canvas, useThree } from '@react-three/fiber';
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
  
  // Hover controls state for fullscreen mode
  const [showControls, setShowControls] = useState(false);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-hide controls after a delay when in fullscreen mode
  useEffect(() => {
    if (fullScreen && showControls && controlsTimeout.current === null) {
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
  }, [showControls, fullScreen]);
  
  // Mouse move handler to show controls in fullscreen mode
  const handleMouseMove = () => {
    if (fullScreen) {
      setShowControls(true);
      
      // Reset the auto-hide timer
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
        controlsTimeout.current = null;
      }
    }
  };
  
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
  }, [data, timeIndex]);
  
  // Handle play/pause animation
  useEffect(() => {
    const animate = () => {
      setTimeIndex(prevIndex => {
        // Increment by small amount to make it smoother
        const nextIndex = prevIndex + 0.5;
        
        // If we reach the end, loop back to beginning
        if (nextIndex > maxTimeIndex) {
          return 0;
        }
        
        return nextIndex;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, maxTimeIndex]);
  
  // Controls component
  const vizControls = (
    <Collapse in={controlsOpened}>
      <Stack gap="md" my="md">
        <Group>
          <Select
            label="Point Color"
            defaultValue={theme.primaryColor}
            data={Object.keys(theme.colors).map(color => ({ value: color, label: color }))}
            onChange={(value) => {
              if (value) {
                setPointColor(theme.colors[value][isDark ? 4 : 6]);
              }
            }}
            style={{ width: 140 }}
          />
          
          <NumberInput
            label="Point Size"
            value={pointSize}
            onChange={(value) => setPointSize(Number(value))}
            min={1}
            max={20}
            style={{ width: 120 }}
          />
        </Group>
        
        <Switch
          label="Show Motion Trails"
          checked={showTrails}
          onChange={(e) => setShowTrails(e.currentTarget.checked)}
        />
        
        {showTrails && (
          <NumberInput
            label="Trail Length"
            value={trailCount}
            onChange={(value) => setTrailCount(Number(value))}
            min={2}
            max={20}
            style={{ width: 140 }}
          />
        )}
        
        <Stack gap="xs">
          <Text fw={500} size="sm">Timeline</Text>
          <Slider
            value={timeIndex}
            onChange={setTimeIndex}
            min={0}
            max={maxTimeIndex}
            step={0.1}
            label={(value) => value.toFixed(1)}
            marks={[
              { value: 0, label: '0' },
              { value: maxTimeIndex / 2, label: (maxTimeIndex / 2).toFixed(1) },
              { value: maxTimeIndex, label: maxTimeIndex.toFixed(1) },
            ]}
          />
        </Stack>
      </Stack>
    </Collapse>
  );
  
  // Canvas with 3D scene
  const canvasContent = (
    <Canvas style={{ width: '100%', height: '100%', background: 'transparent' }}>
      <Scene 
        data={data} 
        color={pointColor} 
        pointSize={pointSize} 
        timeIndex={timeIndex}
        showTrails={showTrails}
        trailCount={trailCount}
      />
    </Canvas>
  );
  
  // For full screen mode with hovering controls
  if (fullScreen) {
    return (
      <Box style={{ height: '100%', width: '100%', position: 'relative' }} onMouseMove={handleMouseMove}>
        {/* Floating controls that appear on hover */}
        <Transition mounted={showControls} transition="fade" duration={200}>
          {(styles) => (
            <Box
              style={{
                ...styles,
                position: 'absolute',
                bottom: 10,
                left: 0,
                right: 0,
                zIndex: 100,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Paper 
                p="xs" 
                radius="md" 
                style={{ 
                  opacity: 0.9,
                  backdropFilter: 'blur(4px)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  maxWidth: '90%',
                }}
              >
                <Stack gap="sm">
                  <Flex justify="space-between" align="center">
                    <Text fw={500} size="sm">{name}</Text>
                    <Group>
                      <Tooltip label={isPlaying ? 'Pause Animation' : 'Play Animation'}>
                        <Button
                          onClick={() => setIsPlaying(!isPlaying)}
                          variant="subtle"
                          color={isPlaying ? 'red' : 'green'}
                          size="sm"
                          leftSection={isPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                        >
                          {isPlaying ? 'Pause' : 'Play'}
                        </Button>
                      </Tooltip>
                      
                      <Tooltip label="Configure 3D View">
                        <Button 
                          onClick={toggleControls} 
                          variant="subtle"
                          leftSection={<IconAdjustments size={16} />}
                          size="sm"
                        >
                          Settings
                        </Button>
                      </Tooltip>
                    </Group>
                  </Flex>
                  
                  {vizControls}
                </Stack>
              </Paper>
            </Box>
          )}
        </Transition>
        
        <div style={{ width: '100%', height: '100%' }}>
          {canvasContent}
        </div>
      </Box>
    );
  }
  
  // For dashboard/card view
  return (
    <Card shadow="sm" p="lg" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Title order={4}>{name}</Title>
          <Group gap="xs">
            <Badge>{data.primatives.length} frames</Badge>
            {onFullscreen && (
              <Tooltip label="View Fullscreen">
                <ActionIcon onClick={onFullscreen} variant="subtle">
                  <IconMaximize size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
      </Card.Section>
      
      <div style={{ height: 300, width: '100%' }}>
        {canvasContent}
      </div>
      
      <Group mt="md" justify="space-between">
        <Button 
          onClick={toggleControls} 
          variant="light" 
          leftSection={<IconAdjustments size={16} />}
          size="sm"
        >
          Configure
        </Button>
        
        <Button
          onClick={() => setIsPlaying(!isPlaying)}
          variant="light"
          color={isPlaying ? 'red' : 'green'}
          leftSection={isPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
          size="sm"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
      </Group>
      
      {vizControls}
    </Card>
  );
} 