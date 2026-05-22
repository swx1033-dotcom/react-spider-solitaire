import React, { useState, useEffect } from "react";
import styles from "../styles/Header.module.css";

import { GameMode } from "../types/game";

interface HeaderProps {
  completed: number;
  moveCount: number;
  onNewGame: () => void;
  onUndo?: () => void;
  onHint?: () => void;
  canUndo?: boolean;
  /** When this changes (e.g. new deal), the timer resets — keeps win → Play Again in sync. */
  sessionKey?: number;
  mode?: GameMode;
  onModeChange?: (mode: GameMode) => void;
  onTimeUp?: () => void;
  isGameOver?: boolean;
  timeRef?: React.MutableRefObject<number>;
}

const Header: React.FC<HeaderProps> = ({
  completed,
  moveCount,
  onNewGame,
  onUndo,
  onHint,
  canUndo = false,
  sessionKey = 0,
  mode = "classic",
  onModeChange,
  onTimeUp,
  isGameOver = false,
  timeRef,
}) => {
  const [timer, setTimer] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(300);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  useEffect(() => {
    if (timeRef) {
      timeRef.current = mode === "classic" ? timer : countdown;
    }
  }, [timer, countdown, mode, timeRef]);

  useEffect(() => {
    let interval: number;
    if (isRunning && !isGameOver) {
      interval = window.setInterval(() => {
        if (mode === "classic") {
          setTimer((prev) => prev + 1);
        } else {
          setCountdown((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              onTimeUp?.();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, mode, isGameOver, onTimeUp]);

  useEffect(() => {
    if (completed === 8) setIsRunning(false);
  }, [completed]);

  useEffect(() => {
    setTimer(0);
    setCountdown(300);
    setIsRunning(true);
  }, [sessionKey, mode]);

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
    setCountdown(300);
    setIsRunning(true);
    onNewGame();
  };

  const handleModeToggle = (): void => {
    const newMode = mode === "classic" ? "time_attack" : "classic";
    onModeChange?.(newMode);
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
            <span className={styles.statLabel}>Mode:</span>
            <button
              type="button"
              className={styles.modeToggleBtn}
              onClick={handleModeToggle}
            >
              {mode === "classic" ? "Classic" : "Time Attack"}
            </button>
          </div>
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
            <span className={styles.statValue}>
              {mode === "classic" ? formatTime(timer) : formatTime(countdown)}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.rightSection}>
        <button
          type="button"
          className={`${styles.btn} ${styles.iconBtn}`}
          onClick={() => setIsRunning(!isRunning)}
          title={isRunning ? "Pause Timer" : "Resume Timer"}
        >
          {isRunning ? "⏸️" : "▶️"}
        </button>
      </div>
    </div>
  );
};

export default Header;
