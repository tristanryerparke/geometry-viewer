import "./index.css";
import { GeometryViewer, GeometryShape } from "./components/GeometryViewer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Sample data for different shapes
const sampleShapes: Record<string, GeometryShape> = {
  triangle: {
    id: "triangle",
    name: "Triangle",
    type: "polygon",
    points: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 2, y: 3 },
      { x: 0, y: 0 }, // Close the polygon
    ],
  },
  square: {
    id: "square",
    name: "Square",
    type: "polygon",
    points: [
      { x: 1, y: 1 },
      { x: 4, y: 1 },
      { x: 4, y: 4 },
      { x: 1, y: 4 },
      { x: 1, y: 1 }, // Close the polygon
    ],
  },
  pentagon: {
    id: "pentagon",
    name: "Pentagon",
    type: "polygon",
    points: [
      { x: 3, y: 0 },
      { x: 5.85, y: 1.76 },
      { x: 4.88, y: 4.76 },
      { x: 1.12, y: 4.76 },
      { x: 0.15, y: 1.76 },
      { x: 3, y: 0 }, // Close the polygon
    ],
  },
  star: {
    id: "star",
    name: "Star",
    type: "polygon",
    points: [
      { x: 3, y: 0 },
      { x: 3.5, y: 2 },
      { x: 6, y: 2 },
      { x: 4.25, y: 3.5 },
      { x: 5, y: 6 },
      { x: 3, y: 4.5 },
      { x: 1, y: 6 },
      { x: 1.75, y: 3.5 },
      { x: 0, y: 2 },
      { x: 2.5, y: 2 },
      { x: 3, y: 0 }, // Close the polygon
    ],
  },
  hexagon: {
    id: "hexagon",
    name: "Hexagon",
    type: "polygon",
    points: [
      { x: 4, y: 0 },
      { x: 6, y: 2 },
      { x: 6, y: 4 },
      { x: 4, y: 6 },
      { x: 2, y: 4 },
      { x: 2, y: 2 },
      { x: 4, y: 0 }, // Close the polygon
    ],
  },
  zigzag: {
    id: "zigzag",
    name: "Zigzag Line",
    type: "polyline",
    points: [
      { x: 0, y: 2 },
      { x: 1, y: 4 },
      { x: 2, y: 1 },
      { x: 3, y: 5 },
      { x: 4, y: 0 },
      { x: 5, y: 3 },
    ],
  },
  sine: {
    id: "sine",
    name: "Sine Wave",
    type: "polyline",
    points: Array.from({ length: 25 }, (_, i) => ({
      x: i * 0.25,
      y: 3 + 2 * Math.sin(i * 0.25 * Math.PI),
    })),
  },
  spiral: {
    id: "spiral",
    name: "Spiral",
    type: "polyline",
    points: Array.from({ length: 50 }, (_, i) => {
      const angle = i * 0.3;
      const radius = i * 0.1;
      return {
        x: 3 + radius * Math.cos(angle),
        y: 3 + radius * Math.sin(angle),
      };
    }),
  },
  // Large test shape for testing auto-framing
  largeBuilding: {
    id: "largeBuilding",
    name: "Large Building",
    type: "polygon",
    points: [
      { x: -50, y: -30 },
      { x: 50, y: -30 },
      { x: 50, y: -20 },
      { x: 40, y: -20 },
      { x: 40, y: 20 },
      { x: 50, y: 20 },
      { x: 50, y: 30 },
      { x: -50, y: 30 },
      { x: -50, y: 20 },
      { x: -40, y: 20 },
      { x: -40, y: -20 },
      { x: -50, y: -20 },
      { x: -50, y: -30 }, // Close the polygon
    ],
  },
  points: {
    id: "points",
    name: "Point Cloud",
    type: "points",
    points: Array.from({ length: 20 }, (_, i) => ({
      x: Math.cos(i * 0.314) * (2 + i * 0.1),
      y: Math.sin(i * 0.314) * (2 + i * 0.1),
    })),
  },
};

// Predefined shape combinations
const shapePresets = {
  single: "Single Shape",
  multiple: "Multiple Shapes",
  large: "Large Shape",
  mixed: "Mixed Types",
};

export function App() {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof shapePresets>("single");
  const [selectedSingleShape, setSelectedSingleShape] = useState<keyof typeof sampleShapes>("triangle");

  const getShapesToDisplay = (): GeometryShape[] => {
    switch (selectedPreset) {
      case "single":
        return [sampleShapes[selectedSingleShape]];
      case "multiple":
        return [sampleShapes.triangle, sampleShapes.square, sampleShapes.pentagon];
      case "large":
        return [sampleShapes.largeBuilding];
      case "mixed":
        return [sampleShapes.hexagon, sampleShapes.zigzag, sampleShapes.points];
      default:
        return [sampleShapes.triangle];
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Top controls */}
      <div className="flex flex-wrap gap-4 items-center p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <label htmlFor="preset-select" className="text-sm font-medium">Preset:</label>
          <Select value={selectedPreset} onValueChange={(value) => setSelectedPreset(value as keyof typeof shapePresets)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(shapePresets).map(([key, name]) => (
                <SelectItem key={key} value={key}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPreset === "single" && (
          <div className="flex items-center gap-2">
            <label htmlFor="shape-select" className="text-sm font-medium">Shape:</label>
            <Select value={selectedSingleShape} onValueChange={(value) => setSelectedSingleShape(value as keyof typeof sampleShapes)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sampleShapes).map(([key, shape]) => (
                  <SelectItem key={key} value={key}>
                    {shape.name} ({shape.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="ml-auto text-xs text-muted-foreground">
          <span>Geometry Viewer Demo</span>
        </div>
      </div>

      {/* GeometryViewer taking up remaining space */}
      <div className="flex-1 min-h-0">
        <GeometryViewer shapes={getShapesToDisplay()} />
      </div>
    </div>
  );
}

export default App;
