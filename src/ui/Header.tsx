import React, { useState, useEffect } from "react";
import styles from "../styles/Header.module.css";
import { GameMode } from "../utils/game";

interface HeaderProps {
  completed: number;
  moveCount: number;
  onNewGame: (mode?: GameMode) => void;
  onUndo?: () => void;
  onHint?: () => void;
  canUndo?: boolean;
  sessionKey?: number;
  gameMode?: GameMode;
  onModeSwitch?: (mode: GameMode) => void;
  timeRemaining?: number;
  isTimerRunning?: boolean;
  isGameOver?: boolean;
  onToggleTimer?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  completed,
  moveCount,
  onNewGame,
  onUndo,
  onHint,
  canUndo = false,
  sessionKey = 0,
  gameMode = "classic",
  onModeSwitch,
  timeRemaining = 0,
  isTimerRunning = true,
  isGameOver = false,
  onToggleTimer,
}) => {
  const [timer, setTimer] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [localGameMode, setLocalGameMode] = useState<GameMode>(gameMode);

  useEffect(() => {
    let interval: number;
    if (isRunning && localGameMode === "classic") {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, localGameMode]);

  useEffect(() => {
    if (completed === 8) setIsRunning(false);
  }, [completed]);

  useEffect(() => {
    setTimer(0);
    setIsRunning(true);
    setLocalGameMode(gameMode);
  }, [sessionKey, gameMode]);

  useEffect(() => {
    setIsRunning(isTimerRunning);
  }, [isTimerRunning]);

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

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNewGame = (): void => {
    setTimer(0);
    setIsRunning(true);
    onNewGame(localGameMode);
  };

  const handleModeSwitch = (mode: GameMode): void => {
    setLocalGameMode(mode);
    onModeSwitch?.(mode);
  };

  const isTimedMode = localGameMode === "timed";
  const isGameCompleted = completed === 8;

  return (
    <div className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.modeSwitch}>
          <button
            type="button"
            className={`${styles.modeBtn} ${!isTimedMode ? styles.activeMode : ""}`}
            onClick={() => handleModeSwitch("classic")}
          >
            经典模式
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${isTimedMode ? styles.activeMode : ""}`}
            onClick={() => handleModeSwitch("timed")}
          >
            限时挑战
          </button>
        </div>
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
            <span className={styles.statLabel}>{isTimedMode ? "倒计时" : "Time"}:</span>
            <span className={`${styles.statValue} ${isTimedMode ? styles.countdown : ""}`}>
              {isTimedMode ? formatCountdown(timeRemaining) : formatTime(timer)}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.rightSection}>
        <button
          type="button"
          className={`${styles.btn} ${styles.iconBtn}`}
          onClick={() => onToggleTimer?.()}
          title={isTimerRunning ? "Pause Timer" : "Resume Timer"}
        >
          {isTimerRunning ? "⏸️" : "▶️"}
        </button>
      </div>
    </div>
  );
};

export default Header;
