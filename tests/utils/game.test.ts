import { describe, it, expect, beforeEach } from "vitest";
import {
  initiateGame,
  getRank,
  isSameSuit,
  isValidMove,
  checkCompletedSet,
  isValidDescendingRun,
  findGameHint,
  hasLegalMoves,
  shuffleTableau,
} from "../../src/utils/game";
import type { Card } from "../../src/types/game";

describe("Game Utils", () => {
  describe("initiateGame", () => {
    it("should create a game with correct number of cards", () => {
      const game = initiateGame();

      expect(game.cards).toHaveLength(104); // 8 decks * 13 cards
      expect(game.decks).toHaveLength(15); // 10 columns + 5 stock piles
    });

    it("should have correct card distribution", () => {
      const game = initiateGame();

      // First 4 columns should have 6 cards each
      for (let i = 0; i < 4; i++) {
        expect(game.decks[i]).toHaveLength(6);
      }

      // Next 6 columns should have 5 cards each
      for (let i = 4; i < 10; i++) {
        expect(game.decks[i]).toHaveLength(5);
      }

      // Stock piles should have 10 cards each
      for (let i = 10; i < 15; i++) {
        expect(game.decks[i]).toHaveLength(10);
      }
    });

    it("should have only the top card face up in each column", () => {
      const game = initiateGame();

      // Only first 10 decks (game columns) should have face-up cards
      for (let i = 0; i < 10; i++) {
        const deck = game.decks[i];
        if (deck.length > 0) {
          // Last card should be face up
          expect(deck[deck.length - 1].isDown).toBe(false);

          // All other cards should be face down
          for (let j = 0; j < deck.length - 1; j++) {
            expect(deck[j].isDown).toBe(true);
          }
        }
      }

      // Stock piles (decks 10-14) should all be face down
      for (let i = 10; i < 15; i++) {
        const deck = game.decks[i];
        deck.forEach((card) => {
          expect(card.isDown).toBe(true);
        });
      }
    });

    it("should have all 13 ranks represented 8 times each", () => {
      const game = initiateGame();
      const rankCounts: Record<string, number> = {};

      game.cards.forEach((card) => {
        rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
      });

      const expectedRanks = [
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
      ];
      expectedRanks.forEach((rank) => {
        expect(rankCounts[rank]).toBe(8);
      });
    });
  });

  describe("getRank", () => {
    it("should return correct numeric values for face cards", () => {
      expect(getRank("A")).toBe(1);
      expect(getRank("J")).toBe(11);
      expect(getRank("Q")).toBe(12);
      expect(getRank("K")).toBe(13);
    });

    it("should return correct numeric values for number cards", () => {
      expect(getRank("2")).toBe(2);
      expect(getRank("5")).toBe(5);
      expect(getRank("10")).toBe(10);
    });

    it("should handle edge cases", () => {
      expect(getRank("0")).toBe(0);
      expect(getRank("15")).toBe(15);
    });
  });

  describe("isSameSuit", () => {
    it("should always return true (one suit game)", () => {
      const card1: Card = { rank: "A", isDown: false };
      const card2: Card = { rank: "K", isDown: false };

      expect(isSameSuit(card1, card2)).toBe(true);
    });
  });

  describe("isValidMove", () => {
    it("should allow any face-up card onto an empty column", () => {
      expect(isValidMove({ rank: "K", isDown: false }, null)).toBe(true);
      expect(isValidMove({ rank: "Q", isDown: false }, null)).toBe(true);
      expect(isValidMove({ rank: "A", isDown: false }, null)).toBe(true);
      expect(isValidMove({ rank: "7", isDown: false }, null)).toBe(true);
    });

    it("should not allow face-down card onto empty column", () => {
      expect(isValidMove({ rank: "Q", isDown: true }, null)).toBe(false);
    });

    it("should not allow moving to face-down card", () => {
      const selectedCard: Card = { rank: "Q", isDown: false };
      const targetCard: Card = { rank: "K", isDown: true };

      expect(isValidMove(selectedCard, targetCard)).toBe(false);
    });

    it("should allow valid descending sequence", () => {
      const selectedCard: Card = { rank: "Q", isDown: false };
      const targetCard: Card = { rank: "K", isDown: false };

      expect(isValidMove(selectedCard, targetCard)).toBe(true);
    });

    it("should not allow invalid sequence", () => {
      const selectedCard: Card = { rank: "K", isDown: false };
      const targetCard: Card = { rank: "Q", isDown: false };

      expect(isValidMove(selectedCard, targetCard)).toBe(false);
    });

    it("should not allow same rank", () => {
      const selectedCard: Card = { rank: "Q", isDown: false };
      const targetCard: Card = { rank: "Q", isDown: false };

      expect(isValidMove(selectedCard, targetCard)).toBe(false);
    });

    it("should handle edge cases", () => {
      const selectedCard: Card = { rank: "A", isDown: false };
      const targetCard: Card = { rank: "2", isDown: false };

      expect(isValidMove(selectedCard, targetCard)).toBe(true);
    });
  });

  describe("checkCompletedSet", () => {
    it("should return null for deck with less than 13 face-up cards", () => {
      const deck: Card[] = [
        { rank: "K", isDown: false },
        { rank: "Q", isDown: false },
        { rank: "J", isDown: false },
      ];

      expect(checkCompletedSet(deck)).toBeNull();
    });

    it("should return null when no valid set exists", () => {
      const deck = [
        { rank: "K", isDown: false },
        { rank: "Q", isDown: false },
        { rank: "J", isDown: false },
        { rank: "10", isDown: false },
        { rank: "9", isDown: false },
        { rank: "8", isDown: false },
        { rank: "7", isDown: false },
        { rank: "6", isDown: false },
        { rank: "5", isDown: false },
        { rank: "4", isDown: false },
        { rank: "3", isDown: false },
        { rank: "2", isDown: false },
        { rank: "5", isDown: false }, // Sıralamayı bozan kart
      ];

      expect(checkCompletedSet(deck)).toBeNull();
    });

    it("should return valid set when complete sequence exists", () => {
      const deck: Card[] = [
        { rank: "K", isDown: false },
        { rank: "Q", isDown: false },
        { rank: "J", isDown: false },
        { rank: "10", isDown: false },
        { rank: "9", isDown: false },
        { rank: "8", isDown: false },
        { rank: "7", isDown: false },
        { rank: "6", isDown: false },
        { rank: "5", isDown: false },
        { rank: "4", isDown: false },
        { rank: "3", isDown: false },
        { rank: "2", isDown: false },
        { rank: "A", isDown: false },
      ];

      const result = checkCompletedSet(deck);
      expect(result).not.toBeNull();
      expect(result!.cards).toHaveLength(13);
      expect(result!.cards[0].rank).toBe("K");
      expect(result!.cards[12].rank).toBe("A");
    });

    it("should return correct set when multiple sequences exist", () => {
      const deck: Card[] = [
        { rank: "K", isDown: false },
        { rank: "Q", isDown: false },
        { rank: "J", isDown: false },
        { rank: "10", isDown: false },
        { rank: "9", isDown: false },
        { rank: "8", isDown: false },
        { rank: "7", isDown: false },
        { rank: "6", isDown: false },
        { rank: "5", isDown: false },
        { rank: "4", isDown: false },
        { rank: "3", isDown: false },
        { rank: "2", isDown: false },
        { rank: "A", isDown: false },
        { rank: "K", isDown: false }, // Start of another sequence
        { rank: "Q", isDown: false },
      ];

      const result = checkCompletedSet(deck);
      expect(result).not.toBeNull();
      expect(result!.cards).toHaveLength(13);
      expect(result!.cards[0].rank).toBe("K");
      expect(result!.cards[12].rank).toBe("A");
    });

    it("should handle face-down cards in the middle", () => {
      const deck: Card[] = [
        { rank: "K", isDown: false },
        { rank: "Q", isDown: false },
        { rank: "J", isDown: false },
        { rank: "10", isDown: false },
        { rank: "9", isDown: false },
        { rank: "8", isDown: false },
        { rank: "7", isDown: false },
        { rank: "6", isDown: false },
        { rank: "5", isDown: false },
        { rank: "4", isDown: false },
        { rank: "3", isDown: false },
        { rank: "2", isDown: false },
        { rank: "A", isDown: false },
        { rank: "K", isDown: true }, // Face-down card
        { rank: "Q", isDown: false },
      ];

      const result = checkCompletedSet(deck);
      expect(result).not.toBeNull();
      expect(result!.cards).toHaveLength(13);
      expect(result!.cards[0].rank).toBe("K");
      expect(result!.cards[12].rank).toBe("A");
    });

    it("should report startIndex matching slice position in deck", () => {
      const deck: Card[] = [
        { rank: "X", isDown: true },
        { rank: "X", isDown: true },
        { rank: "K", isDown: false },
        { rank: "Q", isDown: false },
        { rank: "J", isDown: false },
        { rank: "10", isDown: false },
        { rank: "9", isDown: false },
        { rank: "8", isDown: false },
        { rank: "7", isDown: false },
        { rank: "6", isDown: false },
        { rank: "5", isDown: false },
        { rank: "4", isDown: false },
        { rank: "3", isDown: false },
        { rank: "2", isDown: false },
        { rank: "A", isDown: false },
      ];
      const result = checkCompletedSet(deck);
      expect(result?.startIndex).toBe(2);
    });
  });

  describe("isValidDescendingRun", () => {
    it("accepts a single face-up card", () => {
      const d: Card[] = [{ rank: "7", isDown: false }];
      expect(isValidDescendingRun(d, 0)).toBe(true);
    });

    it("rejects broken order", () => {
      const d: Card[] = [
        { rank: "K", isDown: false },
        { rank: "7", isDown: false },
      ];
      expect(isValidDescendingRun(d, 0)).toBe(false);
    });

    it("accepts K–Q–J", () => {
      const d: Card[] = [
        { rank: "K", isDown: false },
        { rank: "Q", isDown: false },
        { rank: "J", isDown: false },
      ];
      expect(isValidDescendingRun(d, 0)).toBe(true);
    });
  });

  describe("findGameHint", () => {
    const empty15 = (): Card[][] => Array.from({ length: 15 }, () => []);

    it("prioritizes a full K→A column", () => {
      const ranks = [
        "K",
        "Q",
        "J",
        "10",
        "9",
        "8",
        "7",
        "6",
        "5",
        "4",
        "3",
        "2",
        "A",
      ];
      const decks = empty15();
      decks[0] = ranks.map((rank) => ({ rank, isDown: false }));
      const h = findGameHint(decks);
      expect(h.kind).toBe("complete");
      expect(h.text).toContain("Column 1");
    });

    it("suggests a legal column move", () => {
      const decks = empty15();
      decks[0] = [{ rank: "K", isDown: false }];
      decks[1] = [{ rank: "Q", isDown: false }];
      const h = findGameHint(decks);
      expect(h.kind).toBe("move");
      expect(h.text).toMatch(/column 2.*column 1/i);
    });

    it("suggests deal when no moves remain and stock has cards", () => {
      const decks = empty15();
      for (let i = 0; i < 10; i++) {
        decks[i] = [{ rank: "6", isDown: false }];
      }
      decks[10] = [{ rank: "A", isDown: true }];
      const h = findGameHint(decks);
      expect(h.kind).toBe("deal");
    });

    it("suggests moving onto an empty column when any stack can fill it", () => {
      const decks = empty15();
      decks[0] = [{ rank: "3", isDown: false }];
      decks[1] = [];
      decks[10] = [{ rank: "A", isDown: true }];
      const h = findGameHint(decks);
      expect(h.kind).toBe("move");
      expect(h.text).toMatch(/column 1.*column 2/i);
    });

    it("returns stuck when no move and cannot deal", () => {
      const decks = empty15();
      for (let i = 0; i < 10; i++) {
        decks[i] = [{ rank: "6", isDown: false }];
      }
      const h = findGameHint(decks);
      expect(h.kind).toBe("stuck");
    });
  });

  describe("hasLegalMoves", () => {
    const empty15 = (): Card[][] => Array.from({ length: 15 }, () => []);

    it("returns true when stock has cards", () => {
      const decks = empty15();
      decks[10] = [{ rank: "A", isDown: true }];
      expect(hasLegalMoves(decks)).toBe(true);
    });

    it("returns true when a legal column move exists", () => {
      const decks = empty15();
      decks[0] = [{ rank: "K", isDown: false }];
      decks[1] = [{ rank: "Q", isDown: false }];
      expect(hasLegalMoves(decks)).toBe(true);
    });

    it("returns true when a card can move to an empty column", () => {
      const decks = empty15();
      decks[0] = [{ rank: "3", isDown: false }];
      decks[1] = [];
      expect(hasLegalMoves(decks)).toBe(true);
    });

    it("returns false when no moves and stock is empty", () => {
      const decks = empty15();
      for (let i = 0; i < 10; i++) {
        decks[i] = [{ rank: "6", isDown: false }];
      }
      expect(hasLegalMoves(decks)).toBe(false);
    });

    it("returns false when all cards are face-down and stock is empty", () => {
      const decks = empty15();
      for (let i = 0; i < 10; i++) {
        decks[i] = [{ rank: "K", isDown: true }];
      }
      expect(hasLegalMoves(decks)).toBe(false);
    });

    it("returns true when a descending run can move to a target", () => {
      const decks = empty15();
      decks[0] = [
        { rank: "K", isDown: false },
        { rank: "Q", isDown: false },
      ];
      decks[1] = [{ rank: "K", isDown: false }];
      expect(hasLegalMoves(decks)).toBe(true);
    });
  });

  describe("shuffleTableau", () => {
    it("preserves column lengths", () => {
      const decks: Card[][] = Array.from({ length: 15 }, () => []);
      decks[0] = [
        { rank: "K", isDown: false },
        { rank: "Q", isDown: true },
        { rank: "J", isDown: false },
      ];
      decks[1] = [{ rank: "A", isDown: false }];
      decks[2] = [
        { rank: "5", isDown: false },
        { rank: "4", isDown: false },
      ];

      const result = shuffleTableau(decks);

      expect(result[0]).toHaveLength(3);
      expect(result[1]).toHaveLength(1);
      expect(result[2]).toHaveLength(2);
    });

    it("preserves stock piles unchanged", () => {
      const decks: Card[][] = Array.from({ length: 15 }, () => []);
      decks[10] = [{ rank: "A", isDown: true }];
      decks[11] = [{ rank: "2", isDown: true }];

      const result = shuffleTableau(decks);

      expect(result[10]).toEqual([{ rank: "A", isDown: true }]);
      expect(result[11]).toEqual([{ rank: "2", isDown: true }]);
    });

    it("sets all tableau cards to face-up", () => {
      const decks: Card[][] = Array.from({ length: 15 }, () => []);
      decks[0] = [
        { rank: "K", isDown: true },
        { rank: "Q", isDown: true },
      ];

      const result = shuffleTableau(decks);

      for (let i = 0; i < 10; i++) {
        result[i].forEach((card) => {
          expect(card.isDown).toBe(false);
        });
      }
    });

    it("preserves the same set of cards (same ranks)", () => {
      const decks: Card[][] = Array.from({ length: 15 }, () => []);
      decks[0] = [
        { rank: "K", isDown: false },
        { rank: "Q", isDown: true },
      ];
      decks[1] = [{ rank: "A", isDown: false }];

      const result = shuffleTableau(decks);

      const originalRanks = [decks[0], decks[1]]
        .flat()
        .map((c) => c.rank)
        .sort();
      const shuffledRanks = [result[0], result[1]]
        .flat()
        .map((c) => c.rank)
        .sort();
      expect(shuffledRanks).toEqual(originalRanks);
    });
  });
});
