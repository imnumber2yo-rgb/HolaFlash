import { Mascot, Collectable } from "../types";

export const MASCOTS: Mascot[] = [
  {
    id: "paco",
    name: "Paco the Parrot",
    emoji: "🦜",
    personality: "Enthusiastic and loud",
    color: "from-orange-400 to-orange-600",
    catchphrase: "¡Increíble! You're flying high!",
  },
  {
    id: "lola",
    name: "Lola the Llama",
    emoji: "🦙",
    personality: "Chill and supportive",
    color: "from-purple-400 to-purple-600",
    catchphrase: "No drama, just llama. Great job!",
  },
  {
    id: "tico",
    name: "Tico the Toucan",
    emoji: "🐦",
    personality: "Wise and observant",
    color: "from-blue-400 to-blue-600",
    catchphrase: "A wise choice of words, my friend.",
  },
  {
    id: "benny",
    name: "Benny the Bull",
    emoji: "🐂",
    personality: "Strong and determined",
    color: "from-red-400 to-red-600",
    catchphrase: "Strong effort! Charge ahead!",
  },
];

export const COLLECTABLES: Collectable[] = [
  // Total Mastery
  { id: "bronze_medal", name: "Bronze Medal", emoji: "🥉", description: "Mastered 5 words", requirementType: "total_mastery", requirementValue: 5 },
  { id: "silver_medal", name: "Silver Medal", emoji: "🥈", description: "Mastered 10 words", requirementType: "total_mastery", requirementValue: 10 },
  { id: "gold_medal", name: "Gold Medal", emoji: "🥇", description: "Mastered 20 words", requirementType: "total_mastery", requirementValue: 20 },
  { id: "crown", name: "Golden Crown", emoji: "👑", description: "Mastered 50 words", requirementType: "total_mastery", requirementValue: 50 },
  { id: "trophy", name: "Grand Trophy", emoji: "🏆", description: "Mastered 100 words", requirementType: "total_mastery", requirementValue: 100 },
  { id: "rocket", name: "Polyglot Legend", emoji: "🚀", description: "Mastered 500 words", requirementType: "total_mastery", requirementValue: 500 },

  // Category Specific
  { id: "noun_novice", name: "Noun Novice", emoji: "📦", description: "Mastered 5 nouns", requirementType: "category_mastery", requirementValue: 5, category: "noun" },
  { id: "noun_expert", name: "Noun Expert", emoji: "🍎", description: "Mastered 20 nouns", requirementType: "category_mastery", requirementValue: 20, category: "noun" },
  { id: "noun_legend", name: "Noun Legend", emoji: "🏛️", description: "Mastered 50 nouns", requirementType: "category_mastery", requirementValue: 50, category: "noun" },
  
  { id: "verb_novice", name: "Verb Novice", emoji: "👟", description: "Mastered 5 verbs", requirementType: "category_mastery", requirementValue: 5, category: "verb" },
  { id: "verb_master", name: "Verb Master", emoji: "🏃", description: "Mastered 20 verbs", requirementType: "category_mastery", requirementValue: 20, category: "verb" },
  { id: "verb_god", name: "Verb God", emoji: "⚡", description: "Mastered 50 verbs", requirementType: "category_mastery", requirementValue: 50, category: "verb" },
  
  { id: "adj_novice", name: "Adjective Novice", emoji: "✨", description: "Mastered 5 adjectives", requirementType: "category_mastery", requirementValue: 5, category: "adjective" },
  { id: "adj_pro", name: "Adjective Pro", emoji: "🎨", description: "Mastered 20 adjectives", requirementType: "category_mastery", requirementValue: 20, category: "adjective" },
  { id: "adj_wizard", name: "Adjective Wizard", emoji: "🧙", description: "Mastered 50 adjectives", requirementType: "category_mastery", requirementValue: 50, category: "adjective" },
  
  { id: "phrase_novice", name: "Phrase Novice", emoji: "💬", description: "Mastered 5 phrases", requirementType: "category_mastery", requirementValue: 5, category: "phrase" },
  { id: "phrase_king", name: "Phrase King", emoji: "🗣️", description: "Mastered 20 phrases", requirementType: "category_mastery", requirementValue: 20, category: "phrase" },
  { id: "phrase_emperor", name: "Phrase Emperor", emoji: "👑", description: "Mastered 50 phrases", requirementType: "category_mastery", requirementValue: 50, category: "phrase" },

  // Streak Based
  { id: "streak_3", name: "3-Day Streak", emoji: "🔥", description: "Maintain a 3-day streak", requirementType: "streak", requirementValue: 3 },
  { id: "streak_7", name: "Week Warrior", emoji: "📅", description: "Maintain a 7-day streak", requirementType: "streak", requirementValue: 7 },
  { id: "streak_30", name: "Monthly Master", emoji: "🌙", description: "Maintain a 30-day streak", requirementType: "streak", requirementValue: 30 },
];
