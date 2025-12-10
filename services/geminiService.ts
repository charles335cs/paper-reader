import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PaperAnalysis } from "../types";

const processFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    problemSolved: {
      type: Type.STRING,
      description: "A concise explanation of the core problem the paper aims to solve.",
    },
    innovations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of main contributions or innovations proposed in the paper.",
    },
    comparisonMethods: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of existing methods or baselines the paper compares against.",
    },
    limitations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of limitations, defects, or future work mentioned in the paper.",
    },
    summary: {
      type: Type.STRING,
      description: "A brief executive summary of the entire paper.",
    },
  },
  required: ["problemSolved", "innovations", "comparisonMethods", "limitations", "summary"],
};

export const analyzePaper = async (file: File): Promise<PaperAnalysis> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const base64Data = await processFileToBase64(file);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data,
            },
          },
          {
            text: "Analyze this research paper. Identify the problem it solves, its key innovations, the methods it compares against, and its limitations or defects. Provide a structured response.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are an expert academic researcher. Your goal is to critically analyze research papers and extract key insights concisely.",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini.");
    }

    return JSON.parse(text) as PaperAnalysis;
  } catch (error) {
    console.error("Error analyzing paper:", error);
    throw error;
  }
};

export const translateAnalysis = async (data: PaperAnalysis): Promise<PaperAnalysis> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            text: `Translate the values of the following JSON object into simplified Chinese. 
            Maintain the exact same JSON structure and keys. Do not translate the keys.
            Ensure the tone is professional and academic.

            Input JSON:
            ${JSON.stringify(data)}`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini.");
    }

    return JSON.parse(text) as PaperAnalysis;
  } catch (error) {
    console.error("Error translating analysis:", error);
    throw error;
  }
};