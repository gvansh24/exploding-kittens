export enum CardType {
  EXPLODING_KITTEN = "EXPLODING_KITTEN",
  DEFUSE = "DEFUSE",
  SKIP = "SKIP",
  ATTACK = "ATTACK",
  SEE_THE_FUTURE = "SEE_THE_FUTURE",
  SHUFFLE = "SHUFFLE",
  FAVOR = "FAVOR",
  NOPE = "NOPE",
  CATTERMELON = "CATTERMELON",
  TACOCAT = "TACOCAT",
  HAIRY_POTATO_CAT = "HAIRY_POTATO_CAT",
  BEARD_CAT = "BEARD_CAT",
  RAINBOW_RALPHING_CAT = "RAINBOW_RALPHING_CAT"
}

export interface Card {
  id: string;
  type: CardType;
  title: string;
  description: string;
  color: string;
  emoji: string;
}

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  hand: Card[];
  isDead: boolean;
  botPersonality?: string;
}

export interface GameLog {
  id: string;
  playerName: string;
  action: string;
  detail?: string;
  isImportant?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  scenario: string; // visual setup or backstory text
}

export interface RulesQuestionResponse {
  answer: string;
  verdict: "ALLOWED" | "FORBIDDEN" | "DEPENDS" | "INFO";
  rulesReference: string;
}
