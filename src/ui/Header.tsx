import React, { useState, useEffect } from "react";
import styles from "../styles/Header.module.css";

interface HeaderProps {
  completed: number;
  moveCount: number;
  onNewGame: () => void;
  onUndo?: () => void;
  onHint?: () => void;
  onShuffle?: () => void;
  canUndo?: boolean;
  shuffleCount?: number;
  maxShuffles?: number;
  sessionKey?: number;
}

const Header: React.FC<HeaderProps> = ({
  completed,
  moveCount,
  onNewGame,
  onUndo,
  onHint,
  onShuffle,
  canUndo = false,
  shuffleCount = 0,
  maxShuffles = 3,
  sessionKey = 0,
}) => {
  const [timer, setTimer] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  useEffect(() => {
    let interval: number;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (completed === 8) setIsRunning(false);
  }, [completed]);

  useEffect(() => {
    setTimer(0);
    setIsRunning(true);
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
    setIsRunning(true);
    onNewGame();
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
        <button
          type="button"
          className={`${styles.btn} ${styles.shuffleBtn} ${
            shuffleCount >= maxShuffles ? styles.disabled : ""
          }`}
          onClick={() => onShuffle?.()}
          disabled={shuffleCount >= maxShuffles}
          title={`Shuffle tableau (${maxShuffles - shuffleCount} remaining)`}
        >
          🔀 Shuffle {shuffleCount}/{maxShuffles}
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
            <span className={styles.statValue}>{formatTime(timer)}</span>
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
