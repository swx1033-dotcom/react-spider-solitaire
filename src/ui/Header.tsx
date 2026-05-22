import React, { useState, useEffect } from "react";
import styles from "../styles/Header.module.css";
import type { GameMode } from "../types/game";

const CHALLENGE_TIME = 300;

interface HeaderProps {
  completed: number;
  moveCount: number;
  onNewGame: () => void;
  onUndo?: () => void;
  onHint?: () => void;
  canUndo?: boolean;
  sessionKey?: number;
  gameMode: GameMode;
  onSwitchMode: (mode: GameMode) => void;
  isGameOver?: boolean;
  onTimeUp?: () => void;
  timerRef?: React.MutableRefObject<{ elapsed: number; remaining: number }>;
}

const Header: React.FC<HeaderProps> = ({
  completed,
  moveCount,
  onNewGame,
  onUndo,
  onHint,
  canUndo = false,
  sessionKey = 0,
  gameMode,
  onSwitchMode,
  isGameOver = false,
  onTimeUp,
  timerRef,
}) => {
  const [timer, setTimer] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(CHALLENGE_TIME);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const timeUpCalledRef = React.useRef(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
        if (gameMode === "challenge") {
          setCountdown((prev) => {
            if (prev <= 1) {
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, gameMode]);

  useEffect(() => {
    if (
      gameMode === "challenge" &&
      countdown <= 0 &&
      isRunning &&
      !timeUpCalledRef.current
    ) {
      timeUpCalledRef.current = true;
      setIsRunning(false);
      onTimeUp?.();
    }
  }, [countdown, gameMode, isRunning, onTimeUp]);

  useEffect(() => {
    if (completed === 8 || isGameOver) setIsRunning(false);
  }, [completed, isGameOver]);

  useEffect(() => {
    setTimer(0);
    setCountdown(CHALLENGE_TIME);
    setIsRunning(true);
    timeUpCalledRef.current = false;
  }, [sessionKey]);

  useEffect(() => {
    if (timerRef) {
      timerRef.current = {
        elapsed: timer,
        remaining: gameMode === "challenge" ? countdown : 0,
      };
    }
  }, [timer, countdown, gameMode, timerRef]);

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
    setCountdown(CHALLENGE_TIME);
    setIsRunning(true);
    timeUpCalledRef.current = false;
    onNewGame();
  };

  const handleSwitchMode = (mode: GameMode): void => {
    if (mode === gameMode) return;
    setTimer(0);
    setCountdown(CHALLENGE_TIME);
    setIsRunning(true);
    timeUpCalledRef.current = false;
    onSwitchMode(mode);
  };

  const isGameCompleted = completed === 8;
  const interactionDisabled = isGameOver;

  return (
    <div className={styles.header}>
      <div className={styles.leftSection}>
        <button type="button" className={styles.btn} onClick={handleNewGame}>
          🎮 New Game
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.undoBtn} ${
            !canUndo || interactionDisabled ? styles.disabled : ""
          }`}
          onClick={() => onUndo?.()}
          disabled={!canUndo || interactionDisabled}
        >
          ↩️ Undo
        </button>
        <button
          type="button"
          className={`${styles.btn} ${
            interactionDisabled ? styles.disabled : ""
          }`}
          onClick={() => onHint?.()}
          disabled={interactionDisabled}
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
            <span className={styles.statValue}>{formatTime(timer)}</span>
          </div>
          {gameMode === "challenge" && (
            <div
              className={`${styles.statItem} ${
                countdown <= 30 && countdown > 0 ? styles.countdownWarning : ""
              }`}
            >
              <span className={styles.statLabel}>Countdown:</span>
              <span
                className={`${styles.statValue} ${
                  countdown <= 30 && countdown > 0
                    ? styles.countdownWarningValue
                    : ""
                } ${countdown === 0 ? styles.countdownExpired : ""}`}
              >
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
            className={`${styles.modeBtn} ${
              gameMode === "classic" ? styles.modeBtnActive : ""
            }`}
            onClick={() => handleSwitchMode("classic")}
            disabled={interactionDisabled}
          >
            Classic
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${
              gameMode === "challenge" ? styles.modeBtnActive : ""
            }`}
            onClick={() => handleSwitchMode("challenge")}
            disabled={interactionDisabled}
          >
            Challenge
          </button>
        </div>
        <button
          type="button"
          className={`${styles.btn} ${styles.iconBtn} ${
            interactionDisabled ? styles.disabled : ""
          }`}
          onClick={() => setIsRunning(!isRunning)}
          title={isRunning ? "Pause Timer" : "Resume Timer"}
          disabled={interactionDisabled}
        >
          {isRunning ? "⏸️" : "▶️"}
        </button>
      </div>
    </div>
  );
};

export default Header;