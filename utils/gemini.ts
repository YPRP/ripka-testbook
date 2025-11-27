import { GoogleGenAI } from "@google/genai";

// --- Types ---
export interface Question {
  id: number;
  text: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
}

export interface PreExtractionAudit {
  total_questions: number;
  topics_detected: string[];
  content_complexity: "HIGH" | "LOW";
  ocr_quality: "CLEAN" | "POOR";
  recommended_model: "GEMINI_PRO" | "GEMINI_FLASH";
}

export interface ExtractedData {
  audit?: PreExtractionAudit;
  summary: {
    totalQuestions: number;
    topics: string[];
    difficultyDistribution?: {
      Easy: number;
      Medium: number;
      Hard: number;
    };
  };
  questions: Question[];
}

// --- API Initialization ---
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Helper delay function for backoff
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 1. Performs a high-level audit of the document.
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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
  } catch (error) {
    console.error("Audit failed:", error);
    // Fallback default
    return {
      total_questions: 20,
      topics_detected: ["General"],
      content_complexity: "HIGH",
      ocr_quality: "POOR",
      recommended_model: "GEMINI_FLASH",
    };
  }
}

/**
 * 2. Helper function to extract a specific range of questions.
 */
export async function extractBatch(
  base64Data: string,
  mimeType: string,
  startQ: number,
  endQ: number,
  modelName: string
): Promise<Question[]> {
  const prompt = `
    ROLE: Expert Exam parser and Data Aligner.
    
    TASK: Extract questions numbered ${startQ} to ${endQ} from the provided image.
    
    INSTRUCTIONS:
    1. Identify questions clearly marked with numbers between ${startQ} and ${endQ}.
    2. Extract the question text, all options (if MCQ), and the answer (if marked).
    3. If no answer is marked, DO NOT HALLUCINATE. Leave it empty.
    4. Determine the "difficulty" (Easy/Medium/Hard) and "topic" based on the content.
    5. Generate a short "explanation" for the correct answer.
    6. Format the output strictly as a JSON array of Question objects.

    OUTPUT SCHEMA:
    [
      {
        "id": number,
        "text": "Question text here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": "Correct option text or label",
        "explanation": "Brief explanation",
        "difficulty": "Medium",
        "topic": "Algebra"
      }
    ]
  `;

  // Map internal model names to API model strings if needed
  const targetModel = modelName === "GEMINI_PRO" ? "gemini-2.0-pro-exp-02-05" : "gemini-2.0-flash";

  try {
    const response = await ai.models.generateContent({
      model: targetModel,
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
    const jsonMatch = text.match(/\[[\s\S]*\]/); 
    const cleanJson = jsonMatch ? jsonMatch[0] : "[]";
    const data = JSON.parse(cleanJson);
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error extracting batch ${startQ}-${endQ}:`, error);
    return [];
  }
}

/**
 * 3. Orchestrator: Analyzes PDF and manages batch extraction.
 * This was MISSING in your code.
 */
export async function analyzePDF(
  base64Data: string,
  mimeType: string,
  onProgress: (msg: string) => void
): Promise<ExtractedData> {
  
  // Step 1: Audit
  onProgress("Auditing document complexity...");
  const audit = await getPreExtractionAudit(base64Data, mimeType);
  
  console.log("Audit Result:", audit);
  onProgress(`Detected ${audit.total_questions} questions. Starting extraction...`);

  const totalQuestions = audit.total_questions || 20;
  const BATCH_SIZE = 10; // Extract 10 questions at a time
  const allQuestions: Question[] = [];

  // Step 2: Batch Extraction Loop
  for (let i = 1; i <= totalQuestions; i += BATCH_SIZE) {
    const start = i;
    const end = Math.min(i + BATCH_SIZE - 1, totalQuestions);
    
    onProgress(`Extracting questions ${start} to ${end}...`);
    
    // Add delay to avoid rate limits
    if (i > 1) await delay(2000);

    const batchQuestions = await extractBatch(
      base64Data, 
      mimeType, 
      start, 
      end, 
      audit.recommended_model
    );

    // Normalize IDs to ensure they are unique and sequential based on our loop
    const normalizedBatch = batchQuestions.map((q, idx) => ({
      ...q,
      id: start + idx // Override ID to ensure sequence
    }));

    allQuestions.push(...normalizedBatch);
  }

  onProgress("Finalizing test data...");

  // Step 3: Synthesize Result
  return {
    audit,
    summary: {
      totalQuestions: allQuestions.length,
      topics: audit.topics_detected,
      difficultyDistribution: {
        Easy: allQuestions.filter(q => q.difficulty === 'Easy').length,
        Medium: allQuestions.filter(q => q.difficulty === 'Medium').length,
        Hard: allQuestions.filter(q => q.difficulty === 'Hard').length,
      }
    },
    questions: allQuestions
  };
}

/**
 * 4. AI Study Companion Chat Helper
 * This was MISSING in your code.
 */
export async function getStudyHelp(
  query: string, 
  weakTopics: string[]
): Promise<string> {
  const context = weakTopics.length > 0 
    ? `The student is weak in these topics: ${weakTopics.join(', ')}. Try to relate answers to these if relevant.` 
    : "";

  const prompt = `
    ROLE: You are a friendly and encouraging AI Tutor for students.
    CONTEXT: ${context}
    USER QUERY: ${query}
    
    INSTRUCTIONS:
    - Answer the user's doubt clearly and concisely.
    - If it's a math problem, solve it step-by-step.
    - Use bolding for key terms.
    - Keep the tone supportive.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: {
        parts: [{ text: prompt }],
      },
    });
    return response.text || "I'm having trouble connecting right now. Please try again.";
  } catch (error) {
    console.error("Study Help Error:", error);
    return "Sorry, I'm currently offline. Please check your internet connection.";
  }
}
