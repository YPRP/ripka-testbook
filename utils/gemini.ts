import { ExtractedData, Question, PreExtractionAudit } from "../types";

// ⚠️ మీ API KEY ని ఇక్కడ పేస్ట్ చేయండి
const API_KEY = "AIzaSyC5nVApYKn32An1ELokNlwVscQnY92VZT0"; 

// 1. స్మార్ట్ ఫంక్షన్: బెస్ట్ మోడల్ ని సెలెక్ట్ చేసుకుంటుంది
async function getBestModel(): Promise<string> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();
    const models = data.models || [];

    // Flash మోడల్స్ ఫ్రీ టైర్ లో ఎక్కువ కోటా ఇస్తాయి, కాబట్టి వాటికే ప్రాధాన్యత
    const preferredModels = ["gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-1.5-flash-002", "gemini-pro"];

    for (const pref of preferredModels) {
      const found = models.find((m: any) => m.name.includes(pref));
      if (found) return found.name.replace("models/", "");
    }
    return models[0]?.name?.replace("models/", "") || "gemini-1.5-flash";
  } catch (e) {
    return "gemini-1.5-flash";
  }
}

async function callGoogleAPI(prompt: string, base64Data: string, mimeType: string, modelName: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
  
  const body = {
    contents: [{
      parts: [
        { inline_data: { mime_type: mimeType, data: base64Data } },
        { text: prompt }
      ]
    }]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
}

// --- Main Logic ---

export async function analyzePDF(base64Data: string, mimeType: string, onProgress: (msg: string) => void): Promise<ExtractedData> {
  try {
    onProgress("Initializing AI...");
    const activeModel = await getBestModel();
    onProgress(`Using Engine: ${activeModel}`);
    
    // 1. Audit: మొత్తం ఎన్ని ప్రశ్నలు ఉన్నాయో తెలుసుకోవడం
    const auditPrompt = 'Analyze this document. Return ONLY valid JSON: { "total_questions": 0, "topics_detected": [], "content_complexity": "LOW", "ocr_quality": "CLEAN" }. Estimate the total_questions count accurately.';
    
    const auditRes = await callGoogleAPI(auditPrompt, base64Data, mimeType, activeModel);
    let auditJson = { total_questions: 50, topics_detected: [], content_complexity: 'LOW', ocr_quality: 'CLEAN' };
    
    try {
      const cleanJson = auditRes.match(/\{[\s\S]*\}/)?.[0];
      if (cleanJson) auditJson = JSON.parse(cleanJson);
    } catch(e) { console.log("Audit parse failed, using defaults"); }

    // కనీసం 50 అనుకుందాం, ఒకవేళ AI తప్పు చెప్పినా
    const totalQ = auditJson.total_questions || 50;
    onProgress(`Detected approx ${totalQ} questions. Starting extraction...`);

    // 2. Batch Extraction Loop (అన్ని ప్రశ్నలూ రావడానికి)
    const BATCH_SIZE = 20; // ఒక్కసారికి 20 ప్రశ్నలు
    const allQuestions: Question[] = [];
    
    // లూప్ స్టార్ట్
    for (let start = 1; start <= totalQ; start += BATCH_SIZE) {
      const end = Math.min(start + BATCH_SIZE - 1, totalQ);
      
      onProgress(`Extracting Questions ${start} to ${end} of ${totalQ}...`);
      
      const extractPrompt = `
        Act as a strict data extractor.
        Task: Extract questions numbered ${start} to ${end} from the provided document.
        
        Return ONLY valid JSON with this structure:
        {
          "questions": [
            {
              "id": number,
              "text": "Full question text",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "answer": "Correct Option Text",
              "explanation": "Detailed explanation if available",
              "difficulty": "Easy/Medium/Hard",
              "topic": "Topic Name"
            }
          ]
        }
      `;

      try {
        const batchRes = await callGoogleAPI(extractPrompt, base64Data, mimeType, activeModel);
        const batchJsonStr = batchRes.match(/\{[\s\S]*\}/)?.[0];
        
        if (batchJsonStr) {
          const batchData = JSON.parse(batchJsonStr);
          if (Array.isArray(batchData.questions)) {
            allQuestions.push(...batchData.questions);
          }
        }
      } catch (err) {
        console.warn(`Batch ${start}-${end} failed, skipping...`);
      }
    }
    
    if (allQuestions.length === 0) throw new Error("Extraction failed. Please check if the PDF is clear.");

    // డూప్లికేట్స్ తీసేయడం & సార్టింగ్
    const uniqueMap = new Map();
    allQuestions.forEach(q => uniqueMap.set(q.id, q));
    const finalQuestions = Array.from(uniqueMap.values()).sort((a:any, b:any) => a.id - b.id);

    return {
      audit: auditJson as any,
      summary: {
        totalQuestions: finalQuestions.length,
        topics: auditJson.topics_detected || [],
        difficultyDistribution: { Easy: 0, Medium: 0, Hard: 0 }
      },
      questions: finalQuestions
    };

  } catch (error: any) {
    alert("Error: " + error.message); 
    throw error;
  }
}

// Dummy helpers
async function getPreExtractionAudit(b: string, m: string) { return {} as any; }
export async function getStudyHelp(q: string, c: string[]): Promise<string> { return "Chat coming soon."; }