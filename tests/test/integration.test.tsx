import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Swal from "sweetalert2";
import CardBoard from "../../src/ui/CardBoard";
import { initiateGame } from "../../src/utils/game";

vi.mock("../../src/styles/Card.module.css", () => ({
  default: {
    card: "card-class",
    dragging: "dragging-class",
  },
}));

vi.mock("../../src/styles/Header.module.css", () => ({
  default: {
    header: "header-class",
    leftSection: "left-section-class",
    centerSection: "center-section-class",
    rightSection: "right-section-class",
    btn: "btn-class",
    undoBtn: "undo-btn-class",
    disabled: "disabled-class",
    stats: "stats-class",
    statItem: "stat-item-class",
    statLabel: "stat-label-class",
    statValue: "stat-value-class",
    completed: "completed-class",
    iconBtn: "icon-btn-class",
  },
}));

vi.mock("../../src/styles/CardBoard.module.css", () => ({
  default: {
    tableauArea: "tableau-area-class",
    board: "card-board-class",
    pauseOverlay: "pause-overlay-class",
    pauseLabel: "pause-label-class",
  },
}));

vi.mock("../../src/styles/CardHolder.module.css", () => ({
  default: {
    cardHolder: "card-holder-class",
    emptyColumn: "empty-column-class",
  },
}));

vi.mock("../../src/styles/StockCards.module.css", () => ({
  default: {
    stockDeck: "stock-deck-class",
  },
}));

vi.mock("../../src/styles/CardBoardBottom.module.css", () => ({
  default: {
    bottomCardBoard: "bottom-card-board-class",
  },
}));

const getStatValue = (label: string): string => {
  const statItem = screen.getByText(label).closest("div");
  if (!statItem) return "";
  const spans = statItem.querySelectorAll("span");
  return spans[1]?.textContent ?? "";
};

describe("Game Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should have correct card distribution on game start", () => {
    const game = initiateGame();

    expect(game.decks).toHaveLength(15);

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

  it("should pause and resume the unified game clock", () => {
    render(<CardBoard />);

    act(() => {
      vi.advanceTimersByTime(3200);
    });
    expect(getStatValue("Time:")).toBe("0:03");

    fireEvent.click(screen.getByTitle("Pause Game"));
    expect(screen.getByText("Paused")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(getStatValue("Time:")).toBe("0:03");

    fireEvent.click(screen.getByTitle("Resume Game"));

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(getStatValue("Time:")).toBe("0:05");
  });

  it("should block stock dealing while paused", () => {
    render(<CardBoard />);

    fireEvent.click(screen.getByTitle("Pause Game"));
    fireEvent.click(
      screen.getByRole("button", { name: /Deal row from stock pile 1/i }),
    );

    expect(getStatValue("Moves:")).toBe("0");
  });

  it("should confirm and reset when starting a new game from paused state", async () => {
    render(<CardBoard />);

    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(getStatValue("Time:")).toBe("0:01");

    fireEvent.click(screen.getByTitle("Pause Game"));
    fireEvent.click(screen.getByText("🎮 New Game"));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Start a new game?",
          confirmButtonText: "Start New Game",
        }),
      );
    });

    await waitFor(() => {
      expect(getStatValue("Time:")).toBe("0:00");
    });

    expect(screen.getByTitle("Pause Game")).toBeInTheDocument();
    expect(screen.queryByText("Paused")).not.toBeInTheDocument();
  });

  it("should keep undo working while the game is running", () => {
    render(<CardBoard />);

    fireEvent.click(
      screen.getByRole("button", { name: /Deal row from stock pile 1/i }),
    );

    expect(getStatValue("Moves:")).toBe("1");

    fireEvent.click(screen.getByText("↩️ Undo"));

    expect(getStatValue("Moves:")).toBe("0");
  });

  it("should initialize game without performance issues", () => {
    const startTime = performance.now();

    const game = initiateGame();

    const endTime = performance.now();
    const initTime = endTime - startTime;

    expect(initTime).toBeLessThan(50);
    expect(game).toBeDefined();
  });
});
