import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Word, WordCategory, UserStats, Collectable } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    
    // Defensive check for constructor to avoid "Illegal constructor"
    let GAI: any = GoogleGenAI;
    if (typeof GAI !== 'function' && GAI && typeof GAI.GoogleGenAI === 'function') {
      GAI = GAI.GoogleGenAI;
    }

    if (typeof GAI !== 'function') {
      throw new Error("GoogleGenAI constructor not found. Please check @google/genai version.");
    }

    aiInstance = new GAI({ apiKey });
  }
  return aiInstance;
}

export async function evaluateAnswer(
  spanishWord: string,
  correctTranslation: string,
  userAnswer: string,
  difficulty: number = 50 // 0 to 100
): Promise<{ isCorrect: boolean; feedback: string; score: number; synonyms?: string[]; commonErrors?: string[] }> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Evaluate if the user's answer "${userAnswer}" is a correct translation for the Spanish word "${spanishWord}". 
      The primary translation is "${correctTranslation}". 
      Difficulty level: ${difficulty}/100.
      - If difficulty is low (< 30), be very lenient: allow major typos, missing accents, and any remotely valid synonym.
      - If difficulty is medium (30-70), be moderately lenient: allow minor typos and common synonyms.
      - If difficulty is high (> 70), be strict: require near-perfect spelling and precise translations.
      Return a JSON object with:
      - isCorrect: boolean
      - feedback: a short, encouraging message in English
      - score: a number from 0 to 100 based on accuracy.
      - synonyms: an array of 2-3 other valid English translations for "${spanishWord}".
      - commonErrors: an array of 1-2 common mistakes people make when translating "${spanishWord}".`,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error evaluating answer:", error);
    // Fallback logic
    const isExact = userAnswer.toLowerCase().trim() === correctTranslation.toLowerCase().trim();
    return {
      isCorrect: isExact,
      feedback: isExact ? "Perfect!" : "Keep trying!",
      score: isExact ? 100 : 0,
    };
  }
}

export async function suggestNewWord(
  existingWords: string[], 
  blacklist: string[], 
  difficulty: number = 1, 
  masteryScore: number = 0,
  preferredCategory: WordCategory | "all" = "all",
  difficultyAdjustment: number = 50 // 0 to 100
): Promise<{ spanish: string; english: string; category: WordCategory; exampleSentence: string; sentenceTranslation: string }> {
  try {
    const ai = getAI();
    const allExcluded = [...new Set([...existingWords, ...blacklist])];
    
    // Add a random theme to increase variety
    const themes = ["nature", "technology", "emotions", "travel", "food", "work", "hobbies", "urban life", "science", "art", "history", "daily routine", "family", "weather", "shopping"];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    
    // Calculate effective difficulty based on level (1-15+), overall mastery (0-100), and user slider (0-100)
    // Base difficulty from level: 1 to 15+
    // Mastery adjustment: if mastery is high, push harder
    // Slider adjustment: user's explicit preference
    const effectiveDifficulty = Math.round((difficulty * 5) + (masteryScore / 4) + (difficultyAdjustment / 2));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a Spanish word or short phrase that is not in this list: ${allExcluded.slice(-100).join(", ")}.
      Effective Difficulty Score: ${effectiveDifficulty} (Scale: 1-100).
      Target Category: ${preferredCategory === "all" ? "any (noun, verb, adjective, phrase)" : preferredCategory}.
      Theme context: ${randomTheme}.
      
      - If difficulty is low (< 30), suggest very common, basic words (e.g., colors, numbers, basic verbs).
      - If difficulty is medium (30-70), suggest more descriptive adjectives, common objects, and useful conversational phrases.
      - If difficulty is high (> 70), suggest advanced vocabulary, idiomatic expressions, and complex verbs.
      
      Return a JSON object with:
      - spanish: the Spanish word/phrase
      - english: the English translation
      - category: one of "noun", "verb", "adjective", "phrase", "other"
      - exampleSentence: a Spanish sentence using the word, with the word replaced by "_____"
      - sentenceTranslation: the English translation of the sentence (with the word included)`,
      config: {
        responseMimeType: "application/json",
        temperature: 1.0,
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error suggesting word:", error);
    return { 
      spanish: "Libro", 
      english: "Book", 
      category: "noun",
      exampleSentence: "Me gusta leer un _____.", 
      sentenceTranslation: "I like to read a book." 
    }; // Safe fallback
  }
}

export async function analyzeProgress(words: Word[]): Promise<{ summary: string; focusCategories: WordCategory[]; recommendations: string[] }> {
  try {
    const ai = getAI();
    const wordData = words.map(w => ({
      spanish: w.spanish,
      mastery: w.masteryScore,
      category: w.category,
      testCount: w.testCount
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the user's Spanish learning progress based on these words: ${JSON.stringify(wordData)}.
      Identify strengths, weaknesses, and provide a summary of their progress.
      Suggest 2-3 categories to focus on.
      Provide 3 specific recommendations for improvement.
      Return a JSON object with:
      - summary: a short, encouraging summary of progress
      - focusCategories: an array of WordCategory values to focus on
      - recommendations: an array of 3 strings with specific advice`,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error analyzing progress:", error);
    return {
      summary: "You're making steady progress! Keep practicing every day.",
      focusCategories: ["noun", "verb"],
      recommendations: ["Practice more verbs", "Try using words in sentences", "Review your weakest words"]
    };
  }
}

export async function evaluatePronunciation(word: string, transcript: string): Promise<{ score: number; feedback: string; isCorrect: boolean }> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user was trying to say the Spanish word "${word}". 
      The speech-to-text transcript of their attempt is "${transcript}".
      Evaluate their pronunciation. 
      - If the transcript is very close to the word, give a high score.
      - If it's a common mispronunciation, explain why.
      Return a JSON object with:
      - score: 0 to 100
      - feedback: short feedback in English
      - isCorrect: boolean (true if score > 70)`,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error evaluating pronunciation:", error);
    return { score: 50, feedback: "Keep practicing your pronunciation!", isCorrect: false };
  }
}

export async function generateExampleSentence(spanishWord: string, englishWord: string): Promise<{ exampleSentence: string; sentenceTranslation: string }> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a simple Spanish example sentence for the word "${spanishWord}" (English: "${englishWord}").
      Return a JSON object with:
      - exampleSentence: the Spanish sentence with "${spanishWord}" replaced by "_____"
      - sentenceTranslation: the English translation of the full sentence`,
      config: {
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating sentence:", error);
    return { 
      exampleSentence: `¿Dónde está el _____?`, 
      sentenceTranslation: `Where is the ${englishWord}?` 
    };
  }
}

export async function translateWord(spanish: string): Promise<string> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the Spanish word or phrase "${spanish}" to English. Return only the English translation as a plain string.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error translating word:", error);
    return "Translation error";
  }
}

export async function getSpanishAudio(text: string): Promise<string | null> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say in Spanish: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
  } catch (error) {
    console.error("Error generating audio:", error);
  }
  return null;
}

export async function generateNewCollectable(stats: UserStats, date: string): Promise<Collectable> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a new, unique Spanish learning collectable achievement.
      User Stats: ${JSON.stringify(stats)}
      Current Date: ${date}
      
      If there's a holiday or special event near this date, make it themed.
      Otherwise, make it a milestone based on their progress.
      
      Return a JSON object matching this schema:
      {
        "id": "unique_id_string",
        "name": "Creative Name",
        "emoji": "Single Emoji",
        "description": "Short description of the achievement",
        "requirementType": "ai_milestone" | "event",
        "requirementValue": number,
        "category": "noun" | "verb" | "adjective" | "phrase" | "other" (optional)
      }`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text);
    return {
      ...data,
      isAIGenerated: true,
    };
  } catch (error) {
    console.error("Error generating collectable:", error);
    return {
      id: `ai_fallback_${Date.now()}`,
      name: "Mystery Reward",
      emoji: "🎁",
      description: "A mysterious reward for your dedication!",
      requirementType: "ai_milestone",
      requirementValue: stats.xp + 500,
      isAIGenerated: true,
    };
  }
}
