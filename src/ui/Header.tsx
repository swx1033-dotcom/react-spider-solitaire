import React, { useEffect } from "react";
import styles from "../styles/Header.module.css";

interface HeaderProps {
  completed: number;
  moveCount: number;
  isPaused: boolean;
  onNewGame: () => void;
  onTogglePause: () => void;
  onUndo?: () => void;
  onHint?: () => void;
  canUndo?: boolean;
  sessionKey?: number;
}

const Header: React.FC<HeaderProps> = ({
  completed,
  moveCount,
  isPaused,
  onNewGame,
  onTogglePause,
  onUndo,
  onHint,
  canUndo = false,
  sessionKey = 0,
}) => {
  const [timer, setTimer] = React.useState<number>(0);

  useEffect(() => {
    let interval: number;
    if (!isPaused) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (completed === 8) {
      setTimer(0);
    }
  }, [completed]);

  useEffect(() => {
    setTimer(0);
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
          onClick={onTogglePause}
          title={isPaused ? "Resume Game" : "Pause Game"}
        >
          {isPaused ? "▶️" : "⏸️"}
        </button>
      </div>
    </div>
  );
};

export default Header;