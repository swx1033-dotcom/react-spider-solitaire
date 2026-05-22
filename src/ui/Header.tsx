import React from "react";
import type { GameMode } from "../types/game";
import styles from "../styles/Header.module.css";

interface HeaderProps {
  completed: number;
  moveCount: number;
  elapsedTime: number;
  remainingTime?: number;
  mode: GameMode;
  isPaused: boolean;
  canUndo?: boolean;
  canPause?: boolean;
  interactionLocked?: boolean;
  onNewGame: () => void;
  onModeChange: (mode: GameMode) => void;
  onPauseToggle: () => void;
  onUndo?: () => void;
  onHint?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  completed,
  moveCount,
  elapsedTime,
  remainingTime,
  mode,
  isPaused,
  canUndo = false,
  canPause = true,
  interactionLocked = false,
  onNewGame,
  onModeChange,
  onPauseToggle,
  onUndo,
  onHint,
}) => {
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

  const isGameCompleted = completed === 8;
  const isTimedMode = mode === "timed";
  const disableActionButtons = interactionLocked;

  return (
    <div className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.modeSwitch}>
          <button
            type="button"
            className={`${styles.btn} ${styles.modeBtn} ${mode === "classic" ? styles.activeMode : ""}`}
            onClick={() => onModeChange("classic")}
          >
            经典模式
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.modeBtn} ${mode === "timed" ? styles.activeMode : ""}`}
            onClick={() => onModeChange("timed")}
          >
            限时挑战模式
          </button>
        </div>
        <button type="button" className={styles.btn} onClick={onNewGame}>
          🎮 New Game
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.undoBtn} ${
            !canUndo || disableActionButtons ? styles.disabled : ""
          }`}
          onClick={() => onUndo?.()}
          disabled={!canUndo || disableActionButtons}
        >
          ↩️ Undo
        </button>
        <button
          type="button"
          className={`${styles.btn} ${disableActionButtons ? styles.disabled : ""}`}
          onClick={() => onHint?.()}
          disabled={disableActionButtons}
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
            <span className={styles.statValue}>{formatTime(elapsedTime)}</span>
          </div>
          {isTimedMode && typeof remainingTime === "number" && (
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Countdown:</span>
              <span
                className={`${styles.statValue} ${
                  remainingTime <= 30 ? styles.warningTime : ""
                }`}
              >
                {formatTime(remainingTime)}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className={styles.rightSection}>
        <button
          type="button"
          className={`${styles.btn} ${styles.iconBtn} ${
            !canPause || disableActionButtons ? styles.disabled : ""
          }`}
          onClick={onPauseToggle}
          title={isPaused ? "Resume Timer" : "Pause Timer"}
          disabled={!canPause || disableActionButtons}
        >
          {isPaused ? "▶️" : "⏸️"}
        </button>
      </div>
    </div>
  );
};

export default Header;
