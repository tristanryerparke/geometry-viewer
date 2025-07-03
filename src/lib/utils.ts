import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Color generation function for shapes
export function getShapeColor(index: number): string {
  const baseColors = ["#3b82f6", "#ef4444", "#22c55e"]; // Blue, Red, Green
  
  if (index < baseColors.length) {
    return baseColors[index];
  }
  
  // Generate additional colors using HSL for better distribution
  const hue = ((index - 3) * 137.508) % 360; // Golden angle approximation for good distribution
  return `hsl(${hue}, 70%, 50%)`;
}
