import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ComponentProps } from "react";
import Header from "../../src/ui/Header";
import type { GameStatus } from "../../src/types/game";

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

const mockOnNewGame = vi.fn();
const mockOnUndo = vi.fn();
const mockOnHint = vi.fn();
const mockOnTogglePause = vi.fn();

const renderHeader = (props: Partial<ComponentProps<typeof Header>> = {}) => {
  const defaultProps: ComponentProps<typeof Header> = {
    completed: 0,
    moveCount: 0,
    timerSeconds: 0,
    status: "running",
    onNewGame: mockOnNewGame,
    onTogglePause: mockOnTogglePause,
    onUndo: mockOnUndo,
    onHint: mockOnHint,
    canUndo: false,
  };

  return render(<Header {...defaultProps} {...props} />);
};

describe("Header Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render core stats", () => {
    renderHeader({ completed: 3, moveCount: 12, timerSeconds: 125 });

    expect(screen.getByText("3/8")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("2:05")).toBeInTheDocument();
  });

  it("should format long timer durations", () => {
    renderHeader({ timerSeconds: 9000 });

    expect(screen.getByText("2:30:00")).toBeInTheDocument();
  });

  it("should call onNewGame when new game button is clicked", () => {
    renderHeader();

    fireEvent.click(screen.getByText("🎮 New Game"));

    expect(mockOnNewGame).toHaveBeenCalledTimes(1);
  });

  it("should call onUndo when enabled", () => {
    renderHeader({ canUndo: true });

    fireEvent.click(screen.getByText("↩️ Undo"));

    expect(mockOnUndo).toHaveBeenCalledTimes(1);
  });

  it("should disable undo and hint while paused", () => {
    renderHeader({ status: "paused", canUndo: true });

    const undoButton = screen.getByText("↩️ Undo");
    const hintButton = screen.getByText("💡 Hint");

    expect(undoButton).toBeDisabled();
    expect(hintButton).toBeDisabled();

    fireEvent.click(undoButton);
    fireEvent.click(hintButton);

    expect(mockOnUndo).not.toHaveBeenCalled();
    expect(mockOnHint).not.toHaveBeenCalled();
  });

  it("should call onTogglePause while running", () => {
    renderHeader({ status: "running" });

    const pauseButton = screen.getByTitle("Pause Game");
    fireEvent.click(pauseButton);

    expect(mockOnTogglePause).toHaveBeenCalledTimes(1);
    expect(screen.getByText("⏸️")).toBeInTheDocument();
  });

  it("should show resume button while paused", () => {
    renderHeader({ status: "paused" });

    expect(screen.getByTitle("Resume Game")).toBeInTheDocument();
    expect(screen.getByText("▶️")).toBeInTheDocument();
  });

  it("should disable pause toggle after the game is won", () => {
    renderHeader({ status: "won", completed: 8 });

    const pauseButton = screen.getByText("⏸️");
    expect(pauseButton).toBeDisabled();
    expect(screen.getByText("8/8 🎉")).toBeInTheDocument();
  });

  it("should handle undefined optional callbacks gracefully", () => {
    renderHeader({ onUndo: undefined, onHint: undefined, canUndo: true });

    fireEvent.click(screen.getByText("↩️ Undo"));
    fireEvent.click(screen.getByText("💡 Hint"));

    expect(screen.getByText("↩️ Undo")).toBeInTheDocument();
  });

  it("should keep undo disabled when canUndo is false", () => {
    renderHeader({ status: "running", canUndo: false });

    expect(screen.getByText("↩️ Undo")).toBeDisabled();
  });

  it("should render large completed counts", () => {
    renderHeader({ completed: 10, status: "won" as GameStatus });

    expect(screen.getByText("10/8 🎉")).toBeInTheDocument();
  });
});
