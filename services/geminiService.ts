import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeImageForResizing(base64Image: string): Promise<AIAnalysisResult> {
  // Extract mime type and data if in data URI format, otherwise assume raw base64 and png
  let mimeType = 'image/png';
  let data = base64Image;

  const match = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (match) {
    mimeType = match[1];
    data = match[2];
  }

  const prompt = `
    Analyze this image for Content-Aware Scaling (Seam Carving).
    1. Identify the main subject that MUST be preserved.
    2. Suggest a target aspect ratio that removes unnecessary background space while keeping the subject intact.
    3. Provide a short reasoning.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            suggestedAspectRatio: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["subject", "suggestedAspectRatio", "reasoning"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
