import _ from "lodash";
import type { Card, GameInit, CardRank } from "../types/game";

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

export const initiateGame = (): GameInit => {
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

/** Completed K→A run in tableau; startIndex is the index within the full column array. */
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

/** True if from `start` through the bottom of the column is face-up and strictly descending (single-suit Spider). */
export const isValidDescendingRun = (deck: Card[], start: number): boolean => {
  if (start < 0 || start >= deck.length) return false;
  if (deck[start].isDown) return false;
  for (let i = start; i < deck.length - 1; i++) {
    if (deck[i + 1].isDown) return false;
    if (getRank(deck[i].rank) !== getRank(deck[i + 1].rank) + 1) return false;
  }
  return true;
};

/** Finds the starting index of the valid run that is topmost in the column. */
export const findTopmostValidRunStart = (deck: Card[]): number => {
  // Step 1: Find the first (topmost) face-up card
  let firstFaceUp = -1;
  for (let i = 0; i < deck.length; i++) {
    if (!deck[i].isDown) {
      firstFaceUp = i;
      break;
    }
  }
  if (firstFaceUp === -1) return -1;
  
  // Step 2: Now, find the longest consecutive descending sequence starting from firstFaceUp
  // But actually, according to the user's requirement, we just need to find the earliest (topmost)
  // position where we can start a valid descending run, and that has no face-up cards above it.
  
  // But wait, let's really understand the user's requirement:
  // "玩家只能拖拽某一列中从顶部开始的连续降序序列的最顶部那张牌"
  // This means:
  // - In a column, there is a "continuous descending sequence that starts from the top"
  // - Only the MOST TOP card of that particular sequence can be dragged
  
  // Let's think of examples:
  // Example 1: [K(up), Q(up), J(up)]
  // - The top-starting continuous descending sequence is K-Q-J
  // - Only K can be dragged
  
  // Example 2: [5(up), 7(up), 6(up), 5(up)]
  // - The top-starting sequence is just [5] (since 5 can't be followed by 7)
  // - Only the first 5 can be dragged
  
  // Example 3: [K(down), Q(up), J(up)]
  // - The top-starting sequence is Q-J
  // - Only Q can be dragged
  
  // So the rule is: the only draggable card is the FIRST FACE-UP CARD!
  // Because the "continuous descending sequence that starts from the top" will always start there.
  return firstFaceUp;
};

/** True if the given index is the start of the topmost valid descending run. */
export const isTopmostValidRunStart = (deck: Card[], index: number): boolean => {
  const topmostStart = findTopmostValidRunStart(deck);
  // Also need to make sure that from the topmost start, it is a valid descending run
  // (though any single card is always a valid run)
  return topmostStart === index && isValidDescendingRun(deck, topmostStart);
};

export type GameHintKind = "complete" | "move" | "deal" | "stuck";

export type GameHint = {
  kind: GameHintKind;
  text: string;
};

/** Next suggestion for the player (tableau = first 10 decks, stock = 10..14). */
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
      const validStart = findTopmostValidRunStart(col);
      if (validStart === -1) continue;
      const mover = col[validStart];
      if (isValidMove(mover, targetTop)) {
        return {
          kind: "move",
          text: `Try moving from column ${from + 1} to column ${to + 1}.`,
        };
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
