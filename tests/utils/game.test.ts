import { describe, it, expect } from "vitest";
import {
  initiateGame,
  getRank,
  isSameSuit,
  isValidMove,
  checkCompletedSet,
  isValidDescendingRun,
  findGameHint,
  analyzeMoveAvailability,
  reshuffleTableau,
  TABLEAU_COLUMN_COUNT,
} from "../../src/utils/game";
import type { Card } from "../../src/types/game";

describe("Game Utils", () => {
  describe("initiateGame", () => {
    it("should create a game with correct number of cards", () => {
      const game = initiateGame();

      expect(game.cards).toHaveLength(104);
      expect(game.decks).toHaveLength(15);
    });

    it("should have correct card distribution", () => {
      const game = initiateGame();

      for (let i = 0; i < 4; i++) {
        expect(game.decks[i]).toHaveLength(6);
      }

      for (let i = 4; i < 10; i++) {
        expect(game.decks[i]).toHaveLength(5);
      }

      for (let i = 10; i < 15; i++) {
        expect(game.decks[i]).toHaveLength(10);
      }
    });

    it("should have only the top card face up in each column", () => {
      const game = initiateGame();

      for (let i = 0; i < 10; i++) {
        const deck = game.decks[i];
        if (deck.length > 0) {
          expect(deck[deck.length - 1].isDown).toBe(false);
          for (let j = 0; j < deck.length - 1; j++) {
            expect(deck[j].isDown).toBe(true);
          }
        }
      }

      for (let i = 10; i < 15; i++) {
        game.decks[i].forEach((card) => {
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

      ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"].forEach(
        (rank) => {
          expect(rankCounts[rank]).toBe(8);
        },
      );
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
    it("should always return true", () => {
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

    it("should reject invalid sources or targets", () => {
      expect(isValidMove({ rank: "Q", isDown: true }, null)).toBe(false);
      expect(
        isValidMove(
          { rank: "Q", isDown: false },
          { rank: "K", isDown: true },
        ),
      ).toBe(false);
    });

    it("should validate descending sequences", () => {
      expect(
        isValidMove(
          { rank: "Q", isDown: false },
          { rank: "K", isDown: false },
        ),
      ).toBe(true);
      expect(
        isValidMove(
          { rank: "K", isDown: false },
          { rank: "Q", isDown: false },
        ),
      ).toBe(false);
      expect(
        isValidMove(
          { rank: "Q", isDown: false },
          { rank: "Q", isDown: false },
        ),
      ).toBe(false);
      expect(
        isValidMove(
          { rank: "A", isDown: false },
          { rank: "2", isDown: false },
        ),
      ).toBe(true);
    });
  });

  describe("checkCompletedSet", () => {
    it("should return null for deck with less than 13 face-up cards", () => {
      expect(
        checkCompletedSet([
          { rank: "K", isDown: false },
          { rank: "Q", isDown: false },
          { rank: "J", isDown: false },
        ]),
      ).toBeNull();
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
        { rank: "5", isDown: false },
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
      expect(result?.cards).toHaveLength(13);
      expect(result?.cards[0].rank).toBe("K");
      expect(result?.cards[12].rank).toBe("A");
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
      expect(isValidDescendingRun([{ rank: "7", isDown: false }], 0)).toBe(true);
    });

    it("rejects broken order", () => {
      expect(
        isValidDescendingRun(
          [
            { rank: "K", isDown: false },
            { rank: "7", isDown: false },
          ],
          0,
        ),
      ).toBe(false);
    });

    it("accepts K-Q-J", () => {
      expect(
        isValidDescendingRun(
          [
            { rank: "K", isDown: false },
            { rank: "Q", isDown: false },
            { rank: "J", isDown: false },
          ],
          0,
        ),
      ).toBe(true);
    });
  });

  describe("analyzeMoveAvailability", () => {
    const empty15 = (): Card[][] => Array.from({ length: 15 }, () => []);

    it("should detect movable cards onto another column", () => {
      const decks = empty15();
      decks[0] = [{ rank: "K", isDown: false }];
      decks[1] = [{ rank: "Q", isDown: false }];

      expect(analyzeMoveAvailability(decks)).toEqual({
        hasTableauMove: true,
        hasStockCards: false,
      });
    });

    it("should detect empty-column moves without scanning every card pair", () => {
      const decks = empty15();
      decks[0] = [{ rank: "7", isDown: false }];

      expect(analyzeMoveAvailability(decks)).toEqual({
        hasTableauMove: true,
        hasStockCards: false,
      });
    });

    it("should report stuck when no tableau move exists and stock is empty", () => {
      const decks = empty15();
      for (let i = 0; i < TABLEAU_COLUMN_COUNT; i++) {
        decks[i] = [{ rank: "6", isDown: false }];
      }

      expect(analyzeMoveAvailability(decks)).toEqual({
        hasTableauMove: false,
        hasStockCards: false,
      });
    });

    it("should report stock availability independently of tableau moves", () => {
      const decks = empty15();
      for (let i = 0; i < TABLEAU_COLUMN_COUNT; i++) {
        decks[i] = [{ rank: "6", isDown: false }];
      }
      decks[10] = [{ rank: "A", isDown: true }];

      expect(analyzeMoveAvailability(decks)).toEqual({
        hasTableauMove: false,
        hasStockCards: true,
      });
    });
  });

  describe("reshuffleTableau", () => {
    it("should preserve tableau column lengths and flip all tableau cards face up", () => {
      const decks: Card[][] = [
        [
          { rank: "K", isDown: true },
          { rank: "Q", isDown: false },
        ],
        [{ rank: "J", isDown: true }],
        ...Array.from({ length: 8 }, () => []),
        [{ rank: "A", isDown: true }],
        ...Array.from({ length: 4 }, () => []),
      ];

      const reshuffled = reshuffleTableau(decks);

      expect(reshuffled.slice(0, 10).map((deck) => deck.length)).toEqual(
        decks.slice(0, 10).map((deck) => deck.length),
      );
      expect(
        reshuffled
          .slice(0, 10)
          .flat()
          .every((card) => card.isDown === false),
      ).toBe(true);
      expect(reshuffled[10]).toEqual([{ rank: "A", isDown: true }]);
    });

    it("should preserve the full set of tableau ranks after reshuffling", () => {
      const decks: Card[][] = [
        [
          { rank: "K", isDown: true },
          { rank: "Q", isDown: false },
        ],
        [
          { rank: "J", isDown: true },
          { rank: "10", isDown: false },
        ],
        ...Array.from({ length: 8 }, () => []),
        ...Array.from({ length: 5 }, () => []),
      ];

      const before = decks
        .slice(0, 10)
        .flat()
        .map((card) => card.rank)
        .sort();
      const after = reshuffleTableau(decks)
        .slice(0, 10)
        .flat()
        .map((card) => card.rank)
        .sort();

      expect(after).toEqual(before);
    });
  });

  describe("findGameHint", () => {
    const empty15 = (): Card[][] => Array.from({ length: 15 }, () => []);

    it("prioritizes a full K-to-A column", () => {
      const ranks = ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "A"];
      const decks = empty15();
      decks[0] = ranks.map((rank) => ({ rank, isDown: false }));
      const hint = findGameHint(decks);
      expect(hint.kind).toBe("complete");
      expect(hint.text).toContain("Column 1");
    });

    it("suggests a legal column move", () => {
      const decks = empty15();
      decks[0] = [{ rank: "K", isDown: false }];
      decks[1] = [{ rank: "Q", isDown: false }];
      const hint = findGameHint(decks);
      expect(hint.kind).toBe("move");
      expect(hint.text).toMatch(/column 2.*column 1/i);
    });

    it("suggests deal when no moves remain and stock has cards", () => {
      const decks = empty15();
      for (let i = 0; i < 10; i++) {
        decks[i] = [{ rank: "6", isDown: false }];
      }
      decks[10] = [{ rank: "A", isDown: true }];
      const hint = findGameHint(decks);
      expect(hint.kind).toBe("deal");
    });

    it("returns stuck when no move and cannot deal", () => {
      const decks = empty15();
      for (let i = 0; i < 10; i++) {
        decks[i] = [{ rank: "6", isDown: false }];
      }
      const hint = findGameHint(decks);
      expect(hint.kind).toBe("stuck");
      expect(hint.text).toContain("Shuffle");
    });
  });
});
