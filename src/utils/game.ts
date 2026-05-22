import _ from "lodash";
import type { Card, GameInit, CardRank, GameMode } from "../types/game";

const cardInfo = {
  rank: [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ] as CardRank[],
  value: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
};

export const initiateGame = (mode: GameMode = "classic"): GameInit => {
  let cards: Card[] = [],
    decks: Card[][];

  cardInfo["rank"].forEach((rank) => {
    for (let i = 1; i <= 8; i++) {
      cards.push({
        rank: rank,
        isDown: true,
      });
    }
  });

  let shuffledCards = _.shuffle(cards);
  const firstPile = _.chunk(shuffledCards.slice(0, 24), 6);
  const secondPile = _.chunk(shuffledCards.slice(24, 54), 5);
  const stockCardsPile = _.chunk(shuffledCards.slice(54), 10);
  decks = [...firstPile, ...secondPile, ...stockCardsPile];

  for (let i = 0; i <= 9; i++) {
    if (decks[i].length > 0) {
      decks[i][decks[i].length - 1].isDown = false;
    }
  }

  return {
    decks: decks,
    cards: shuffledCards,
    mode,
  };
};

export const getRank = (rank: string): number => {
  if (rank === "K" || rank === "Q" || rank === "J" || rank === "A") {
    switch (rank) {
      case "K":
        return 13;
      case "Q":
        return 12;
      case "J":
        return 11;
      case "A":
        return 1;
      default:
        return 0;
    }
  } else {
    return parseInt(rank);
  }
};

export const isSameSuit = (_card1: Card, _card2: Card): boolean => {
  return true;
};

export const isValidMove = (
  selectedCard: Card,
  targetCard: Card | null,
): boolean => {
  if (selectedCard.isDown) return false;
  if (!targetCard) return true;
  if (targetCard.isDown) return false;
  const selectedRank = getRank(selectedCard.rank);
  const targetRank = getRank(targetCard.rank);
  return selectedRank === targetRank - 1;
};

export type CompletedSetResult = { startIndex: number; cards: Card[] };

export const checkCompletedSet = (deck: Card[]): CompletedSetResult | null => {
  const faceUpCards = deck.filter((card) => !card.isDown);
  if (faceUpCards.length < 13) return null;

  const deckIndexOfNthFaceUp = (n: number): number => {
    let seen = 0;
    for (let d = 0; d < deck.length; d++) {
      if (!deck[d].isDown) {
        if (seen === n) return d;
        seen++;
      }
    }
    return -1;
  };

  for (let i = faceUpCards.length - 13; i >= 0; i--) {
    const potentialSet = faceUpCards.slice(i, i + 13);
    if (getRank(potentialSet[0].rank) === 13) {
      let isValidSet = true;
      for (let j = 0; j < 12; j++) {
        const currentRank = getRank(potentialSet[j].rank);
        const nextRank = getRank(potentialSet[j + 1].rank);
        if (currentRank !== nextRank + 1) {
          isValidSet = false;
          break;
        }
      }
      if (isValidSet) {
        const startIndex = deckIndexOfNthFaceUp(i);
        if (startIndex >= 0) {
          return { startIndex, cards: potentialSet };
        }
      }
    }
  }
  return null;
};

export const isValidDescendingRun = (deck: Card[], start: number): boolean => {
  if (start < 0 || start >= deck.length) return false;
  if (deck[start].isDown) return false;
  for (let i = start; i < deck.length - 1; i++) {
    if (deck[i + 1].isDown) return false;
    if (getRank(deck[i].rank) !== getRank(deck[i + 1].rank) + 1) return false;
  }
  return true;
};

export type GameHintKind = "complete" | "move" | "deal" | "stuck";

export type GameHint = {
  kind: GameHintKind;
  text: string;
};

export const findGameHint = (decks: Card[][]): GameHint => {
  for (let c = 0; c < 10; c++) {
    if (checkCompletedSet(decks[c] ?? [])) {
      return {
        kind: "complete",
        text: `Column ${c + 1} has a full King-to-Ace run — it clears after your next move.`,
      };
    }
  }

  for (let to = 0; to < 10; to++) {
    const targetCol = decks[to] ?? [];
    const targetTop =
      targetCol.length === 0 ? null : targetCol[targetCol.length - 1];
    if (targetTop?.isDown) continue;

    for (let from = 0; from < 10; from++) {
      if (from === to) continue;
      const col = decks[from] ?? [];
      for (let start = 0; start < col.length; start++) {
        if (col[start].isDown) continue;
        if (!isValidDescendingRun(col, start)) continue;
        const mover = col[start];
        if (isValidMove(mover, targetTop)) {
          return {
            kind: "move",
            text: `Try moving from column ${from + 1} to column ${to + 1}.`,
          };
        }
      }
    }
  }

  const stockHasCards = decks.slice(10, 15).some((d) => (d?.length ?? 0) > 0);

  if (stockHasCards) {
    return {
      kind: "deal",
      text: "Deal a row from the stock.",
    };
  }

  return {
    kind: "stuck",
    text: "No obvious move — try Undo or a different stack, or start a New Game.",
  };
};
