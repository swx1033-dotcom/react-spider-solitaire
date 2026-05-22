export type GameMode = "classic" | "timed";

export interface Card {
  rank: string;
  isDown: boolean;
  deck?: number;
}

export interface GameState {
  decks: Card[][];
  completed: number;
  moveCount: number;
  shuffleCount: number;
  mode: GameMode;
  isPaused: boolean;
  isGameOver: boolean;
}

export const MAX_SHUFFLE_COUNT = 3;

export interface GameInit {
  decks: Card[][];
  cards: Card[];
}

export type CardRank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";
