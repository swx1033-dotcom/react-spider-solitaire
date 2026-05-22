import React from "react";
import styles from "../styles/Header.module.css";
import type { GameStatus } from "../types/game";

interface HeaderProps {
  completed: number;
  moveCount: number;
  timerSeconds: number;
  status: GameStatus;
  onNewGame: () => void | Promise<void>;
  onTogglePause: () => void;
  onUndo?: () => void;
  onHint?: () => void;
  canUndo?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  completed,
  moveCount,
  timerSeconds,
  status,
  onNewGame,
  onTogglePause,
  onUndo,
  onHint,
  canUndo = false,
}) => {
  const isGameCompleted = status === "won" || completed === 8;
  const isPaused = status === "paused";
  const areGameActionsDisabled = status !== "running";

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.header}>
      <div className={styles.leftSection}>
        <button type="button" className={styles.btn} onClick={() => void onNewGame()}>
          🎮 New Game
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.undoBtn} ${
            !canUndo || areGameActionsDisabled ? styles.disabled : ""
          }`}
          onClick={() => onUndo?.()}
          disabled={!canUndo || areGameActionsDisabled}
        >
          ↩️ Undo
        </button>
        <button
          type="button"
          className={`${styles.btn} ${areGameActionsDisabled ? styles.disabled : ""}`}
          onClick={() => onHint?.()}
          disabled={areGameActionsDisabled}
        >
          💡 Hint
        </button>
      </div>
      <div className={styles.centerSection}>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Completed:</span>
            <span
              className={`${styles.statValue} ${
                isGameCompleted ? styles.completed : ""
              }`}
            >
              {completed}/8 {isGameCompleted && "🎉"}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Moves:</span>
            <span className={styles.statValue}>{moveCount}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Time:</span>
            <span className={styles.statValue}>{formatTime(timerSeconds)}</span>
          </div>
        </div>
      </div>
      <div className={styles.rightSection}>
        <button
          type="button"
          className={`${styles.btn} ${styles.iconBtn}`}
          onClick={onTogglePause}
          disabled={isGameCompleted}
          title={isPaused ? "Resume Game" : "Pause Game"}
        >
          {isPaused ? "▶️" : "⏸️"}
        </button>
      </div>
    </div>
  );
};

export default Header;
