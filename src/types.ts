export type WordCategory = "noun" | "verb" | "adjective" | "phrase" | "other";

export interface Word {
  id: string;
  spanish: string;
  english: string;
  category: WordCategory;
  exampleSentence?: string; // Spanish sentence with a blank
  sentenceTranslation?: string; // English translation
  addedDate: number;
  lastTestedDate?: number;
  nextReviewDate: number; // SRS: When the word is due
  interval: number; // SRS: Current interval in days
  easeFactor: number; // SRS: Ease factor (default 2.5)
  masteryScore: number; // 0 to 100
  testCount: number;
}

export interface SRSSettings {
  initialEaseFactor: number; // default 2.5
  intervalMultiplier: number; // default 1.0
  startingInterval: number; // default 1 (day)
}

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate?: number;
  selectedMascotId: string;
  dailyXPGoal: number;
  dailyXPProgress: number;
  lastGoalResetDate?: number;
  unlockedCollectables: string[]; // IDs of unlocked collectables
  lastAIReviewDate?: number;
  categoryMastery: Record<WordCategory, number>; // Count of mastered words per category
  aiGeneratedCollectables: Collectable[]; // Dynamically generated collectables
  srsSettings: SRSSettings;
  archivedWords: Record<string, number>; // Spanish word -> timestamp of archival
  suggestionSettings: {
    difficultyAdjustment: number; // 0 to 100
    preferredCategory: WordCategory | "all";
  };
}

export interface Collectable {
  id: string;
  name: string;
  emoji: string;
  description: string;
  requirementType: "total_mastery" | "category_mastery" | "streak" | "event" | "ai_milestone";
  requirementValue: number;
  category?: WordCategory;
  isAIGenerated?: boolean;
  eventDate?: string; // e.g., "12-25" for Christmas
}

export interface Mascot {
  id: string;
  name: string;
  emoji: string;
  personality: string;
  color: string;
  catchphrase: string;
}
