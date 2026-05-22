import React, { useState, useEffect, useRef } from "react";
import { initiateGame, findGameHint, GameMode } from "../utils/game";
import CardHolder from "./CardHolder";
import styles from "../styles/CardBoard.module.css";
import Header from "./Header";
import CardBoardBottom from "./CardBoardBottom";
import { GameState } from "../types/game";
import { showInfo, showWonPopup, showGameOverPopup, showTimedModeWinPopup } from "../utils/toaster";

const TIMED_MODE_DURATION = 5 * 60;

const cloneGameState = (g: GameState): GameState => ({
  completed: g.completed,
  moveCount: g.moveCount,
  decks: g.decks.map((col) => col.map((c) => ({ ...c }))),
});

const CardBoard: React.FC = () => {
  const [game, setGame] = useState<GameState>({
    decks: [],
    completed: 0,
    moveCount: 0,
  });
  const [, setGameHistory] = useState<GameState[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [gameKey, setGameKey] = useState<number>(0);
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [timeRemaining, setTimeRemaining] = useState<number>(TIMED_MODE_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const winPopupScheduledRef = useRef(false);

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    if (game.completed < 8) {
      winPopupScheduledRef.current = false;
      return;
    }
    if (winPopupScheduledRef.current) return;
    winPopupScheduledRef.current = true;
    setIsTimerRunning(false);
    const t = window.setTimeout(() => {
      if (gameMode === "timed") {
        showTimedModeWinPopup(timeRemaining, () => {
          winPopupScheduledRef.current = false;
          startNewGame("timed");
        });
      } else {
        showWonPopup(() => {
          winPopupScheduledRef.current = false;
          startNewGame();
        });
      }
    }, 500);
    return () => window.clearTimeout(t);
  }, [game.completed, gameMode, timeRemaining]);

  useEffect(() => {
    if (gameMode !== "timed" || !isTimerRunning || isGameOver) return;
    if (timeRemaining <= 0) {
      setIsGameOver(true);
      setIsTimerRunning(false);
      showGameOverPopup(() => {
        startNewGame();
      });
      return;
    }
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsGameOver(true);
          setIsTimerRunning(false);
          showGameOverPopup(() => {
            startNewGame();
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameMode, isTimerRunning, isGameOver, timeRemaining]);

  const startNewGame = (mode: GameMode = "classic"): void => {
    const init = initiateGame(mode);
    const newGameState: GameState = {
      decks: init.decks,
      completed: 0,
      moveCount: 0,
    };
    setGame(newGameState);
    setGameHistory([]);
    setCanUndo(false);
    setGameKey((prev) => prev + 1);
    setGameMode(mode);
    setTimeRemaining(TIMED_MODE_DURATION);
    setIsTimerRunning(true);
    setIsGameOver(false);
  };

  const handleModeSwitch = (mode: GameMode): void => {
    startNewGame(mode);
  };

  const handleUndo = (): void => {
    if (isGameOver) return;
    setGameHistory((prev) => {
      if (prev.length === 0) return prev;
      const previousState = prev[prev.length - 1];
      setGame(previousState);
      setCanUndo(prev.length - 1 > 0);
      return prev.slice(0, -1);
    });
  };

  const handleHint = (): void => {
    if (isGameOver) return;
    showInfo(findGameHint(game.decks).text);
  };

  const updateGameWithHistory = (
    next: React.SetStateAction<GameState>,
  ): void => {
    if (isGameOver) return;
    setGame((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      setGameHistory((h) => [...h, cloneGameState(prev)]);
      setCanUndo(true);
      return resolved;
    });
  };

  return (
    <div key={gameKey}>
      <Header
        completed={game.completed}
        moveCount={game.moveCount}
        onNewGame={startNewGame}
        onUndo={handleUndo}
        onHint={handleHint}
        canUndo={canUndo}
        sessionKey={gameKey}
        gameMode={gameMode}
        onModeSwitch={handleModeSwitch}
        timeRemaining={timeRemaining}
        isTimerRunning={isTimerRunning}
        isGameOver={isGameOver}
        onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
      />
      <div className={styles.board}>
        {game.decks.slice(0, 10).map((deck, index) => (
          <CardHolder
            deck={deck}
            game={game}
            deckIndex={index}
            setGame={updateGameWithHistory}
            key={`pile${index}`}
          />
        ))}
      </div>
      <CardBoardBottom
        game={game}
        setGame={updateGameWithHistory}
        stockDecks={game.decks.slice(10)}
      />
    </div>
  );
};

export default CardBoard;
