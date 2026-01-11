export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING', // Seam Carving
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED'
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Pixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Seam {
  pixels: number[]; // Array of x-coordinates (if vertical seam) or y-coordinates
  energy: number;
}

export interface AIAnalysisResult {
  subject: string;
  suggestedAspectRatio: string;
  reasoning: string;
}
