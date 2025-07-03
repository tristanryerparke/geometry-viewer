import React, { useState, useRef, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as THREE from "three";
import { getShapeColor } from "@/lib/utils";

// Geometry types
export interface Point2D {
  x: number;
  y: number;
}

export interface GeometryShape {
  id: string;
  name: string;
  type: "polygon" | "polyline" | "points";
  points: Point2D[];
}

export interface GeometryViewerProps {
  shapes: GeometryShape[];
  showPoints?: boolean;
  showGrid?: boolean;
  showFill?: boolean;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface GeometryLineProps {
  shape: GeometryShape;
  color: string;
  lineWidth?: number;
  showPoints?: boolean;
  showFill?: boolean;
}

function GeometryLine({ shape, color, lineWidth = 2, showPoints = true, showFill = false, onPointHover, shapeIndex }: GeometryLineProps & { onPointHover?: (info: { point: Point3D, index: number, mouse: [number, number], shapeIndex: number } | null) => void, shapeIndex: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const lineRef = useRef<THREE.Line>(null);
  const lineLoopRef = useRef<THREE.LineLoop>(null);
  const { points, type } = shape;
  const { camera } = useThree();
  
  // Convert 2D points to 3D (z = 0 for top view)
  let points3D: Point3D[] = points.map(p => ({ x: p.x, y: p.y, z: 0 }));

  // For polygons, close the line by adding the first point to the end if not already closed
  if (type === "polygon" && points3D.length > 2) {
    const first = points3D[0];
    const last = points3D[points3D.length - 1];
    if (first.x !== last.x || first.y !== last.y) {
      points3D = [...points3D, { ...first }];
    }
  }
  
  // Set renderOrder for lines so they draw on top of axis lines
  React.useEffect(() => {
    if (type === "polygon" && lineLoopRef.current) {
      lineLoopRef.current.renderOrder = 2;
    } else if (type !== "points" && lineRef.current) {
      lineRef.current.renderOrder = 2;
    }
  }, [type, points3D.length]);
  
  // Calculate scale for points based on camera zoom (orthographic only)
  let pointScale = 1;
  if (camera instanceof THREE.OrthographicCamera) {
    pointScale = 1 / camera.zoom;
  }

  // Create fill geometry for polygons
  let fillGeometry: THREE.ShapeGeometry | null = null;
  if (type === "polygon" && showFill && points.length > 2) {
    const shape3D = new THREE.Shape();
    shape3D.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) { // Skip last point if it's the same as first (closing point)
      shape3D.lineTo(points[i].x, points[i].y);
    }
    fillGeometry = new THREE.ShapeGeometry(shape3D);
  }

  return (
    <group>
      {/* Line for polygons and polylines */}
      {type !== "points" && (
        type === "polygon" ? (
          <lineLoop ref={lineLoopRef}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={points3D.length}
                array={new Float32Array(points3D.flatMap(p => [p.x, p.y, p.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={color} />
          </lineLoop>
        ) : (
          <line ref={lineRef}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={points3D.length}
                array={new Float32Array(points3D.flatMap(p => [p.x, p.y, p.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={color} />
          </line>
        )
      )}
      
      {/* Fill for polygons */}
      {fillGeometry && showFill && (
        <mesh ref={meshRef} geometry={fillGeometry} rotation={[0, 0, 0]}>
          <meshBasicMaterial color={color} opacity={0.2} transparent />
        </mesh>
      )}
      
      {/* Points */}
      {(showPoints || type === "points") && points3D.map((point, index) => (
        <mesh
          key={index}
          position={[point.x, point.y, point.z]}
          onPointerOver={e => {
            e.stopPropagation();
            onPointHover && onPointHover({ point, index, mouse: [e.clientX, e.clientY], shapeIndex });
          }}
          onPointerMove={e => {
            e.stopPropagation();
            onPointHover && onPointHover({ point, index, mouse: [e.clientX, e.clientY], shapeIndex });
          }}
          onPointerOut={e => {
            e.stopPropagation();
            onPointHover && onPointHover(null);
          }}
          renderOrder={999}
        >
          <sphereGeometry args={[0.05, 24, 24]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

interface GridProps {
  size: number;
  divisions: number;
  color?: string;
}

function Grid({ size, divisions, color = "#e5e7eb" }: GridProps) {
  // Set divisions = size for 1 unit per line
  const gridHelper = new THREE.GridHelper(size, size, color, color);
  gridHelper.rotateX(Math.PI / 2); // Rotate to XY plane for top view
  gridHelper.renderOrder = 0;
  return <primitive object={gridHelper} />;
}

function AxisLines() {
  const { camera } = useThree();
  let length = 1000;
  if (camera instanceof THREE.OrthographicCamera) {
    length = Math.max(
      Math.abs(camera.left) + Math.abs(camera.right),
      Math.abs(camera.top) + Math.abs(camera.bottom)
    ) * 0.6;
  }
  const xAxisRef = useRef<THREE.Line>(null);
  const yAxisRef = useRef<THREE.Line>(null);
  React.useEffect(() => {
    if (xAxisRef.current) xAxisRef.current.renderOrder = 1;
    if (yAxisRef.current) yAxisRef.current.renderOrder = 1;
  }, [length]);
  return (
    <group>
      {/* X-axis */}
      <line ref={xAxisRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([-length, 0, 0, length, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#374151" />
      </line>
      {/* Y-axis */}
      <line ref={yAxisRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, -length, 0, 0, length, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#374151" />
      </line>
    </group>
  );
}

function CameraController({ shapes, resetTrigger }: { shapes: GeometryShape[], resetTrigger: number }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null!);
  
  const resetCameraView = useCallback(() => {
    if (camera && controlsRef.current && shapes.length > 0) {
      // Calculate bounds from all shapes
      const allPoints = shapes.flatMap(shape => shape.points);
      if (allPoints.length === 0) return;
      
      const allX = allPoints.map(p => p.x);
      const allY = allPoints.map(p => p.y);
      const minX = Math.min(...allX);
      const maxX = Math.max(...allX);
      const minY = Math.min(...allY);
      const maxY = Math.max(...allY);
      
      // Calculate bounding box dimensions
      const boundingWidth = maxX - minX;
      const boundingHeight = maxY - minY;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // Set orthographic camera zoom to fit bounds (forum best practice)
      if (camera instanceof THREE.OrthographicCamera) {
        const canvasWidth = gl.domElement.clientWidth;
        const canvasHeight = gl.domElement.clientHeight;
        const aspect = canvasWidth / canvasHeight;
        const padding = 1; // 10% padding

        // Calculate the size to fit, including padding
        const widthWithPadding = boundingWidth * (1 + padding);
        const heightWithPadding = boundingHeight * (1 + padding);

        // Camera frustum size (from left/right/top/bottom)
        const frustumWidth = camera.right - camera.left;
        const frustumHeight = camera.top - camera.bottom;

        // Determine the required zoom to fit the bounding box
        let zoomX = frustumWidth / widthWithPadding;
        let zoomY = frustumHeight / heightWithPadding;
        let zoom = Math.min(zoomX, zoomY);
        // Invert zoom because higher zoom means closer in orthographic
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
      }
      
      // Position camera above the geometry
      camera.position.set(centerX, centerY, 10);
      camera.lookAt(centerX, centerY, 0);
      
      // Reset controls target and update
      if (controlsRef.current) {
        controlsRef.current.target.set(centerX, centerY, 0);
        controlsRef.current.update();
      }
    }
  }, [camera, gl, shapes]);
  
  // Reset view when shapes change
  React.useEffect(() => {
    resetCameraView();
  }, [shapes, resetCameraView]);
  
  // Reset view when reset button is clicked
  React.useEffect(() => {
    if (resetTrigger > 0) {
      resetCameraView();
    }
  }, [resetTrigger, resetCameraView]);
  
  return (
    <OrbitControls
      ref={controlsRef}
      enableRotate={false}
      enablePan={true}
      enableZoom={true}
      // Set LEFT to pan (0), MIDDLE to zoom (1), RIGHT to pan (2)
      mouseButtons={{ LEFT: 2, MIDDLE: 1, RIGHT: 2 }}
      touches={{ ONE: 1, TWO: 2 }}
      zoomSpeed={0.5}
      enableDamping={false}
      panSpeed={1}
    />
  );
}

export function GeometryViewer({ 
  shapes, 
  showPoints: externalShowPoints, 
  showGrid: externalShowGrid, 
  showFill: externalShowFill 
}: GeometryViewerProps) {
  const [showPoints, setShowPoints] = useState(externalShowPoints ?? true);
  const [showGrid, setShowGrid] = useState(externalShowGrid ?? true);
  const [showFill, setShowFill] = useState(externalShowFill ?? true);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<null | { point: Point3D, index: number, mouse: [number, number], shapeIndex: number }>(null);

  // Update internal state when props change
  React.useEffect(() => {
    if (externalShowPoints !== undefined) setShowPoints(externalShowPoints);
  }, [externalShowPoints]);
  
  React.useEffect(() => {
    if (externalShowGrid !== undefined) setShowGrid(externalShowGrid);
  }, [externalShowGrid]);
  
  React.useEffect(() => {
    if (externalShowFill !== undefined) setShowFill(externalShowFill);
  }, [externalShowFill]);

  const handleReset = useCallback(() => {
    setResetTrigger(prev => prev + 1);
  }, []);
  
  // Calculate total points for display
  const totalPoints = shapes.reduce((sum, shape) => sum + shape.points.length, 0);

  if (shapes.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">No geometry to display</p>
          <p className="text-sm">Add some shapes to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Controls at top */}
      <div className="flex flex-wrap gap-4 items-center p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button
          variant={showPoints ? "default" : "outline"}
          size="sm"
          onClick={() => setShowPoints(!showPoints)}
        >
          {showPoints ? "Hide" : "Show"} Points
        </Button>
        
        <Button
          variant={showGrid ? "default" : "outline"}
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
        >
          {showGrid ? "Hide" : "Show"} Grid
        </Button>

        {shapes.some(shape => shape.type === "polygon") && (
          <Button
            variant={showFill ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFill(!showFill)}
          >
            {showFill ? "Hide" : "Show"} Fill
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
        >
          Reset View
        </Button>

        <div className="ml-auto text-sm text-muted-foreground">
          <span className="font-medium">
            {shapes.length} shape{shapes.length !== 1 ? 's' : ''}
          </span>
          <span className="mx-2">•</span>
          <span>{totalPoints} point{totalPoints !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Three.js Canvas taking up remaining space */}
      <div className="flex-1 min-h-0">
        <Canvas 
          orthographic
          camera={{ position: [0, 0, 10], zoom: 1 }}
          style={{ background: 'transparent' }}
        >
          <CameraController shapes={shapes} resetTrigger={resetTrigger} />
          
          {/* Grid (bottom layer) */}
          {showGrid && <Grid size={100} divisions={20} />}
          
          {/* Axis lines (middle layer) */}
          <AxisLines />
          
          {/* Render all shapes (top layer) */}
          {shapes.map((shape, shapeIndex) => (
            <GeometryLine
              key={shape.id}
              shape={shape}
              color={getShapeColor(shapeIndex)}
              showPoints={showPoints}
              showFill={showFill}
              onPointHover={setHoveredPoint}
              shapeIndex={shapeIndex}
            />
          ))}
        </Canvas>
        {/* Tooltip for hovered point, themed with shadcn */}
        {hoveredPoint && (
          <div
            className="fixed z-50 px-3 py-1.5 rounded-md border border-border bg-popover text-popover-foreground shadow-md text-xs font-mono pointer-events-none select-none"
            style={{ left: hoveredPoint.mouse[0] + 10, top: hoveredPoint.mouse[1] + 10 }}
          >
            Shape {hoveredPoint.shapeIndex + 1} — Point {hoveredPoint.index + 1}: ({hoveredPoint.point.x.toFixed(2)}, {hoveredPoint.point.y.toFixed(2)})
          </div>
        )}
      </div>

      {/* Shape legend and coordinates at bottom */}
      <div className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Shape legend */}
        {shapes.length > 1 && (
          <div className="p-2 border-b border-border">
            <div className="flex flex-wrap gap-2">
              {shapes.map((shape, index) => (
                <div key={shape.id} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getShapeColor(index) }}
                  />
                  <span className="font-medium">{shape.name}</span>
                  <span className="text-muted-foreground">({shape.type})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 