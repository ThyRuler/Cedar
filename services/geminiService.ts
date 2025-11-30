
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { Transaction, ExpenseCategory, IncomeCategory, TransactionType, Currency } from '../types';
import { LBP_TO_USD_RATE } from '../constants';

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const CEDAR_SYSTEM_INSTRUCTION = `You are "Cedar," a friendly specialized AI financial assistant focused exclusively on helping users in Lebanon manage their personal budget, track transactions, and generate practical savings advice.

## 1. CORE IDENTITY AND EXCHANGE RATE POLICY
*   **Name & Persona:** You are Cedar. Your tone is professional, practical, empathetic, and highly familiar with the Lebanese economic environment.
*   **Fixed Exchange Rate Policy:** For all transactions, you MUST use a FIXED EXCHANGE RATE of 1 USD = ${LBP_TO_USD_RATE} LBP.
*   **Currency Handling:** All calculations and final budget summaries must be presented with both the local currency (LBP) and the US Dollar equivalent (USD). Always prioritize reporting in USD equivalent for clarity, but include the original LBP value.

## 2. TRANSACTION TRACKING PROTOCOL
When a user describes a transaction, your primary goal is to extract the necessary information and present it back for confirmation in a structured format.
*   **Required Data Points:** Amount, Currency (LBP, Fresh USD, or Lollar), Type (INCOME or EXPENSE), and Category.
*   **Specialized Categories:**
    *   **EXPENSES:** ${Object.values(ExpenseCategory).join(', ')}.
    *   **INCOME:** ${Object.values(IncomeCategory).join(', ')}.
*   **Processing:** When you identify a transaction, you MUST respond ONLY with a JSON object with the key "parsedTransaction" containing the extracted details. Do not add any conversational text before or after the JSON.
    Example user input: "I bought groceries for 895,000 LBP"
    Your required JSON response:
    \`\`\`json
    {
      "parsedTransaction": {
        "amount": 895000,
        "currency": "LBP",
        "type": "EXPENSE",
        "category": "Groceries"
      }
    }
    \`\`\`
    If the user's message is conversational and not a transaction, respond naturally based on the rules below.

## 3. BUDGET & SAVINGS INSIGHTS
*   **Budget Status Reporting:** When asked for a budget summary, use the provided transaction data to give a concise summary: Total Income, Total Expenses, Top 3 Spending Categories, and Remaining Budget (all in USD).
*   **Scenario Planning:** If a user asks for savings advice (e.g., "How can I save $50 more?"), offer practical, specific "what-if" scenarios tied to the Lebanese context. (e.g., "Reducing generator usage," "cutting imported groceries," etc.).
*   **Local Nudges:** Provide empathetic and solution-oriented advice. Instead of "You overspent," suggest re-allocation from other budget categories.`;

function transactionsToContext(transactions: Transaction[]): string {
    if (transactions.length === 0) {
        return "The user has not logged any transactions yet.";
    }
    const history = transactions.map(t => {
        const usdAmount = t.currency === Currency.LBP ? (t.amount / LBP_TO_USD_RATE).toFixed(2) : t.amount.toFixed(2);
        return `- ${t.type}: ${t.category} - ${t.amount.toLocaleString()} ${t.currency} ($${usdAmount} USD) on ${t.date.toLocaleDateString()}`;
    }).join('\n');
    return `Here is the user's transaction history:\n${history}`;
}

export const getCedarResponse = async (prompt: string, transactions: Transaction[], mode: 'fast' | 'smart' | 'genius' | 'search') => {
    const ai = getAi();
    const modelMap = {
        // FIX: Update model alias to conform with coding guidelines.
        fast: 'gemini-flash-lite-latest',
        smart: 'gemini-3-pro-preview',
        genius: 'gemini-3-pro-preview',
        search: 'gemini-2.5-flash'
    };
    const model = modelMap[mode];
    const transactionContext = transactionsToContext(transactions);

    const config: any = {};
    if (mode === 'genius') {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }
    if (mode === 'search') {
        config.tools = [{ googleSearch: {} }];
    }

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: `${CEDAR_SYSTEM_INSTRUCTION}\n\n${transactionContext}`,
                ...config
            }
        });
        return response;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("Failed to get a response from Cedar. Please check your API key and network connection.");
    }
};

export const analyzeReceipt = async (mimeType: string, base64Data: string) => {
    const ai = getAi();
    const model = 'gemini-3-pro-preview';

    const prompt = `You are an expert receipt reader for Lebanese users. Analyze this receipt image and extract key information.
    Your task is to identify the total amount spent and suggest a relevant expense category from this list: ${Object.values(ExpenseCategory).join(', ')}.
    If you identify a transaction, you MUST respond ONLY with a JSON object with the key "parsedTransaction" containing the extracted details. The currency will likely be LBP or USD.
    Example response:
    \`\`\`json
    {
        "parsedTransaction": {
            "amount": 150000,
            "currency": "LBP",
            "type": "EXPENSE",
            "category": "Groceries"
        }
    }
    \`\`\`
    If the image is not a receipt or is unreadable, respond with a conversational error message.`;

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };
    const textPart = { text: prompt };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [imagePart, textPart] },
        });
        return response;
    } catch (error) {
        console.error("Gemini receipt analysis failed:", error);
        throw new Error("Failed to analyze the receipt.");
    }
};

export const speakText = async (text: string) => {
    const ai = getAi();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data received.");
        return base64Audio;
    } catch(error) {
        console.error("Gemini TTS failed:", error);
        throw new Error("Failed to generate speech.");
    }
};

export const generateImage = async (prompt: string, aspectRatio: string, imageSize: string) => {
    const ai = getAi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio, imageSize } },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image was generated.");
    } catch(error) {
        console.error("Gemini image generation failed:", error);
        throw new Error("Failed to generate image.");
    }
}


export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16') => {
    const ai = getAi();
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio,
            }
        });
        return operation;
    } catch (error) {
        console.error("Gemini video generation failed:", error);
        if (error instanceof Error && error.message.includes("not found")) {
             throw new Error("API key not found or invalid. Please select a valid key.");
        }
        throw new Error("Failed to start video generation.");
    }
};

export const checkVideoStatus = async (operation: any) => {
    const ai = getAi();
    try {
        const updatedOperation = await ai.operations.getVideosOperation({ operation });
        if (updatedOperation.done && updatedOperation.response?.generatedVideos?.[0]?.video?.uri) {
             const downloadLink = updatedOperation.response.generatedVideos[0].video.uri;
             const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
             if (!response.ok) throw new Error("Failed to download video blob.");
             const blob = await response.blob();
             return { done: true, url: URL.createObjectURL(blob) };
        }
        return { done: false, url: null };
    } catch (error) {
        console.error("Gemini video status check failed:", error);
        if (error instanceof Error && error.message.includes("not found")) {
             throw new Error("API key not found or invalid. Please select a valid key.");
        }
        throw new Error("Failed to check video status.");
    }
};


export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // remove the "data:mime/type;base64," prefix
        };
        reader.onerror = error => reject(error);
    });
};

// Audio decoding utilities for TTS
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
