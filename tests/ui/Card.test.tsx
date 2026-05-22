import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import Card from "../../src/ui/Card";
import type { GameState, Card as CardType } from "../../src/types/game";

vi.mock("../../src/styles/Card.module.css", () => ({
  default: {
    card: "card-class",
    dragging: "dragging-class",
  },
}));

const mockSetGame = vi.fn();

const createMockGameState = (): GameState => ({
  decks: [
    [
      { rank: "K", isDown: false },
      { rank: "Q", isDown: false },
      { rank: "J", isDown: false },
    ],
    [{ rank: "A", isDown: false }],
    ...Array.from({ length: 13 }, () => []),
  ],
  completed: 0,
  moveCount: 0,
});

const renderCard = (props: {
  data: CardType;
  index: number;
  game: GameState;
  deckIndex: number;
  isInteractionLocked?: boolean;
  interactionLockVersion?: number;
}) => {
  return render(<Card {...props} setGame={mockSetGame} />);
};

describe("Card Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should render card with valid data", () => {
    const cardData: CardType = { rank: "K", isDown: false };
    const game = createMockGameState();

    const { container } = renderCard({
      data: cardData,
      index: 0,
      game,
      deckIndex: 0,
    });

    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("card-class");
  });

  it("should render face-down card", () => {
    const cardData: CardType = { rank: "Q", isDown: true };
    const game = createMockGameState();

    const { container } = renderCard({
      data: cardData,
      index: 1,
      game,
      deckIndex: 0,
    });

    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("card-class");
  });

  it("should return null for invalid card data", () => {
    const invalidCardData = {} as CardType;
    const game = createMockGameState();

    const { container } = renderCard({
      data: invalidCardData,
      index: 0,
      game,
      deckIndex: 0,
    });

    expect(container.firstChild).toBeNull();
  });

  it("should not be draggable when run is invalid from this card", () => {
    const game: GameState = {
      decks: [
        [
          { rank: "K", isDown: false },
          { rank: "7", isDown: false },
        ],
        ...Array.from({ length: 14 }, () => []),
      ],
      completed: 0,
      moveCount: 0,
    };
    const { container } = renderCard({
      data: { rank: "K", isDown: false },
      index: 0,
      game,
      deckIndex: 0,
    });

    expect(container.firstChild).toHaveAttribute("draggable", "false");
  });

  it("should be draggable for a valid descending run from this card", () => {
    const game = createMockGameState();
    const { container } = renderCard({
      data: { rank: "K", isDown: false },
      index: 0,
      game,
      deckIndex: 0,
    });

    expect(container.firstChild).toHaveAttribute("draggable", "true");
  });

  it("should not be draggable while interactions are locked", () => {
    const game = createMockGameState();
    const { container } = renderCard({
      data: { rank: "K", isDown: false },
      index: 0,
      game,
      deckIndex: 0,
      isInteractionLocked: true,
      interactionLockVersion: 1,
    });

    expect(container.firstChild).toHaveAttribute("draggable", "false");
  });

  it("should cancel a drag that crosses into paused state", () => {
    const game = createMockGameState();
    const targetHolder = document.createElement("div");
    targetHolder.className = "cardHolder";
    targetHolder.id = "2";
    document.body.appendChild(targetHolder);
    const elementFromPointSpy = vi
      .spyOn(document, "elementFromPoint")
      .mockReturnValue(targetHolder);

    const { container, rerender } = render(
      <Card
        data={{ rank: "K", isDown: false }}
        index={0}
        game={game}
        deckIndex={0}
        setGame={mockSetGame}
        isInteractionLocked={false}
        interactionLockVersion={0}
      />,
    );

    const card = container.firstChild as HTMLElement;

    fireEvent.dragStart(card, { pageX: 10, pageY: 10 });

    rerender(
      <Card
        data={{ rank: "K", isDown: false }}
        index={0}
        game={game}
        deckIndex={0}
        setGame={mockSetGame}
        isInteractionLocked={true}
        interactionLockVersion={1}
      />,
    );

    fireEvent.dragEnd(card, { clientX: 20, clientY: 20 });

    expect(mockSetGame).not.toHaveBeenCalled();
    elementFromPointSpy.mockRestore();
  });

  it("should handle empty rank", () => {
    const cardData: CardType = { rank: "", isDown: false };
    const game = createMockGameState();

    const { container } = renderCard({
      data: cardData,
      index: 0,
      game,
      deckIndex: 0,
    });

    expect(container.firstChild).toBeNull();
  });

  it("should handle undefined data", () => {
    const undefinedData = undefined as unknown as CardType;
    const game = createMockGameState();

    const { container } = renderCard({
      data: undefinedData,
      index: 0,
      game,
      deckIndex: 0,
    });

    expect(container.firstChild).toBeNull();
  });
});
