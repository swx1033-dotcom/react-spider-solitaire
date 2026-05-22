import React, { useState, useEffect } from "react";
import styles from "../styles/Header.module.css";

export type GameMode = "classic" | "timed";
const TIMED_MODE_DURATION = 5 * 60; // 5 minutes in seconds

interface HeaderProps {
  completed: number;
  moveCount: number;
  onNewGame: () => void;
  onUndo?: () => void;
  onHint?: () => void;
  canUndo?: boolean;
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  isPaused: boolean;
  onPauseToggle: () => void;
  isGameOver: boolean;
  onTimeout?: () => void;
  /** When this changes (e.g. new deal), the timer resets — keeps win → Play Again in sync. */
  sessionKey?: number;
}

const Header: React.FC<HeaderProps> = ({
  completed,
  moveCount,
  onNewGame,
  onUndo,
  onHint,
  canUndo = false,
  mode,
  onModeChange,
  isPaused,
  onPauseToggle,
  isGameOver,
  onTimeout,
  sessionKey = 0,
}) => {
  const [timer, setTimer] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(TIMED_MODE_DURATION);

  // Classic mode timer (increments)
  useEffect(() => {
    let interval: number;
    if (mode === "classic" && !isPaused && !isGameOver) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, isPaused, isGameOver]);

  // Timed mode countdown (decrements)
  useEffect(() => {
    let interval: number;
    if (mode === "timed" && !isPaused && !isGameOver && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            onTimeout?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, isPaused, isGameOver, countdown, onTimeout]);

  useEffect(() => {
    if (completed === 8) {
      // Game won, stop timers
    }
  }, [completed]);

  useEffect(() => {
    // Reset timers when session changes
    setTimer(0);
    setCountdown(TIMED_MODE_DURATION);
  }, [sessionKey]);

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

  const handleNewGame = (): void => {
    setTimer(0);
    setCountdown(TIMED_MODE_DURATION);
    onNewGame();
  };

  const handleModeChange = (newMode: GameMode): void => {
    if (newMode !== mode) {
      onModeChange(newMode);
    }
  };

  const isGameCompleted = completed === 8;

  return (
    <div className={styles.header}>
      <div className={styles.leftSection}>
        <button type="button" className={styles.btn} onClick={handleNewGame}>
          🎮 New Game
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.undoBtn} ${
            !canUndo ? styles.disabled : ""
          }`}
          onClick={() => onUndo?.()}
          disabled={!canUndo}
        >
          ↩️ Undo
        </button>
        <button type="button" className={styles.btn} onClick={() => onHint?.()}>
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
          {mode === "classic" && (
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Time:</span>
              <span className={styles.statValue}>{formatTime(timer)}</span>
            </div>
          )}
          {mode === "timed" && (
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Time Left:</span>
              <span className={`${styles.statValue} ${countdown < 60 ? 'warning' : ''}`}>
                {formatTime(countdown)}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className={styles.rightSection}>
        <div className={styles.modeToggle}>
          <button
            type="button"
            className={`${styles.btn} ${styles.smallBtn} ${mode === "classic" ? styles.active : ""}`}
            onClick={() => handleModeChange("classic")}
          >
            Classic
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.smallBtn} ${mode === "timed" ? styles.active : ""}`}
            onClick={() => handleModeChange("timed")}
          >
            Timed
          </button>
        </div>
        <button
          type="button"
          className={`${styles.btn} ${styles.iconBtn}`}
          onClick={onPauseToggle}
          title={isPaused ? "Resume" : "Pause"}
          disabled={isGameOver}
        >
          {isPaused ? "▶️" : "⏸️"}
        </button>
      </div>
    </div>
  );
};

export default Header;
