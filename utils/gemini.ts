import { GoogleGenAI } from "@google/genai";

// --- Types (Included here to ensure the file compiles standalone) ---
export interface Question {
  id: number;
  text: string;
  options?: string[];
  answer?: string;
  explanation?: string;
}

export interface PreExtractionAudit {
  total_questions: number;
  topics_detected: string[];
  content_complexity: "HIGH" | "LOW";
  ocr_quality: "CLEAN" | "POOR";
  recommended_model: "GEMINI_PRO" | "GEMINI_FLASH";
}

export interface ExtractedData {
  questions: Question[];
}

// --- API Initialization ---
// Ensure VITE_GEMINI_API_KEY is set in your Netlify Environment Variables
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Helper delay function for backoff
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Performs a high-level audit of the document to structure the extraction plan.
 */
export async function getPreExtractionAudit(
  base64Data: string,
  mimeType: string
): Promise<PreExtractionAudit> {
  const prompt = `
    Role: You are an expert AI Document Router for an EdTech application. 
    Your goal is to analyze the uploaded exam document and determine the most efficient AI model for data extraction.

    Task: Scan the attached file (do not extract full content yet) and generate a JSON "Audit Report" based on these criteria:

    1. total_questions: Estimate the total number of questions.
    2. topics_detected: A list of subject names or chapters found.

    3. content_complexity:
       - If content contains complex tables, heavy formulas, logical puzzles, or diagrams -> "HIGH".
       - If content is mostly direct text, simple MCQs, or general knowledge -> "LOW".

    4. ocr_quality:
       - If text is blurry, handwritten, or complex layout -> "POOR".
       - If text is digital, clear, and selectable -> "CLEAN".

    5. recommended_model (The Routing Logic):
       - CRITICAL: If complexity is "HIGH" OR quality is "POOR" -> Output "GEMINI_PRO" (Needs high intelligence/vision).
       - Otherwise -> Output "GEMINI_FLASH" (Speed and efficiency).

    Output Format: JSON
    {
      "total_questions": number,
      "topics_detected": string[],
      "content_complexity": "HIGH" | "LOW",
      "ocr_quality": "CLEAN" | "POOR",
      "recommended_model": "GEMINI_PRO" | "GEMINI_FLASH"
    }
  `;

  // Retry logic for Audit with fallback models
  const modelsToTry = [
    "gemini-2.0-flash", // Updated to stable version names if available, or keep experimental
    "gemini-1.5-flash",
  ];

  for (const model of modelsToTry) {
    try {
      return await tryGenerateAudit(model, prompt, base64Data, mimeType);
    } catch (error: any) {
      console.warn(`Audit failed with ${model}:`, error);
      if (model === modelsToTry[modelsToTry.length - 1]) {
        console.error("All audit models failed, using defaults");
        return {
          total_questions: 50,
          topics_detected: [],
          content_complexity: "HIGH",
          ocr_quality: "POOR",
          recommended_model: "GEMINI_FLASH",
        };
      }
      await delay(1000);
    }
  }

  return {
    total_questions: 50,
    topics_detected: [],
    content_complexity: "HIGH",
    ocr_quality: "POOR",
    recommended_model: "GEMINI_FLASH",
  };
}

async function tryGenerateAudit(
  model: string,
  prompt: string,
  base64Data: string,
  mimeType: string
): Promise<PreExtractionAudit> {
  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: prompt },
      ],
    },
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const text = response.text || "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const cleanJson = jsonMatch ? jsonMatch[0] : "{}";
  return JSON.parse(cleanJson);
}

/**
 * Helper function to extract a specific range of questions.
 * Designed to run in parallel.
 */
export async function extractBatch(
  base64Data: string,
  mimeType: string,
  startQ: number,
  endQ: number,
  modelName: string
): Promise<Question[]> {
  // FIXED: The string below was unterminated in your original code.
  const prompt = `
    ROLE: Expert Exam parser and Data Aligner.
    
    TASK: Extract questions numbered ${startQ} to ${endQ} from the provided image.
    
    INSTRUCTIONS:
    1. Identify questions clearly marked with numbers between ${startQ} and ${endQ}.
    2. Extract the question text, all options (if MCQ), and the answer (if marked).
    3. If no answer is marked, leave the answer field empty.
    4. Format the output strictly as a JSON array of Question objects.

    OUTPUT SCHEMA:
    [
      {
        "id": number,
        "text": "Question text here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": "Correct option text or label",
        "explanation": "Brief explanation if available"
      }
    ]
  `; // <--- This backtick was missing or the string was cut off

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
        ],
      },
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "[]";
    // Sanitize and parse
    const jsonMatch = text.match(/\[[\s\S]*\]/); 
    const cleanJson = jsonMatch ? jsonMatch[0] : "[]";
    const data = JSON.parse(cleanJson);
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error extracting batch ${startQ}-${endQ}:`, error);
    return [];
  }
}
