import React, { useState, useEffect, useRef } from "react";
import { initiateGame, findGameHint } from "../utils/game";
import CardHolder from "./CardHolder";
import styles from "../styles/CardBoard.module.css";
import Header from "./Header";
import CardBoardBottom from "./CardBoardBottom";
import type { GameState, GameMode } from "../types/game";
import { showInfo, showWonPopup, showLostPopup } from "../utils/toaster";

const TIMED_MODE_DURATION = 5 * 60;

const cloneGameState = (g: GameState): GameState => ({
  completed: g.completed,
  moveCount: g.moveCount,
  decks: g.decks.map((col) => col.map((c) => ({ ...c }))),
});

const createEmptyGameState = (): GameState => ({
  decks: [],
  completed: 0,
  moveCount: 0,
});

const CardBoard: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [game, setGame] = useState<GameState>(createEmptyGameState);
  const [gameHistory, setGameHistory] = useState<GameState[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [gameKey, setGameKey] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(TIMED_MODE_DURATION);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const winPopupScheduledRef = useRef(false);
  const lostPopupShownRef = useRef(false);
  const winRemainingTimeRef = useRef<number | null>(null);

  const resetSessionState = (mode: GameMode): void => {
    setElapsedTime(0);
    setRemainingTime(mode === "timed" ? TIMED_MODE_DURATION : 0);
    setIsPaused(false);
    setIsGameOver(false);
    winPopupScheduledRef.current = false;
    lostPopupShownRef.current = false;
    winRemainingTimeRef.current = null;
  };

  const startNewGame = (mode: GameMode = gameMode): void => {
    const init = initiateGame(mode);
    const newGameState: GameState = {
      decks: init.decks,
      completed: 0,
      moveCount: 0,
    };
    setGameMode(init.mode);
    setGame(newGameState);
    setGameHistory([]);
    setCanUndo(false);
    resetSessionState(init.mode);
    setGameKey((prev) => prev + 1);
  };

  useEffect(() => {
    startNewGame("classic");
  }, []);

  const isGameWon = game.completed === 8;
  const shouldRunClock =
    game.decks.length > 0 && !isPaused && !isGameOver && !isGameWon;

  useEffect(() => {
    if (!shouldRunClock) return;

    const interval = window.setInterval(() => {
      setElapsedTime((prev) => prev + 1);
      if (gameMode === "timed") {
        setRemainingTime((prev) => Math.max(prev - 1, 0));
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [gameMode, shouldRunClock, gameKey]);

  useEffect(() => {
    if (game.completed < 8) {
      winPopupScheduledRef.current = false;
      winRemainingTimeRef.current = null;
      return;
    }
    if (winPopupScheduledRef.current) return;
    if (gameMode === "timed") {
      winRemainingTimeRef.current = remainingTime;
    }
    setIsGameOver(true);
    setIsPaused(false);
    winPopupScheduledRef.current = true;
    const t = window.setTimeout(() => {
      showWonPopup(
        () => {
          winPopupScheduledRef.current = false;
          startNewGame(gameMode);
        },
        gameMode === "timed"
          ? (winRemainingTimeRef.current ?? remainingTime)
          : undefined,
      );
    }, 500);
    return () => window.clearTimeout(t);
  }, [game.completed, gameMode, remainingTime]);

  useEffect(() => {
    if (gameMode !== "timed") return;
    if (remainingTime > 0) return;
    if (isGameOver || isGameWon || lostPopupShownRef.current) return;

    setIsGameOver(true);
    setIsPaused(false);
    lostPopupShownRef.current = true;
    showLostPopup(() => {
      lostPopupShownRef.current = false;
      startNewGame(gameMode);
    });
  }, [gameMode, remainingTime, isGameOver, isGameWon]);

  const handleUndo = (): void => {
    if (isGameOver || gameHistory.length === 0) return;
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

  const handlePauseToggle = (): void => {
    if (isGameOver || isGameWon || game.decks.length === 0) return;
    setIsPaused((prev) => !prev);
  };

  const handleModeChange = (mode: GameMode): void => {
    if (mode === gameMode) return;
    startNewGame(mode);
  };

  const updateGameWithHistory = (
    next: React.SetStateAction<GameState>,
  ): void => {
    if (isGameOver) return;
    setGame((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      setGameHistory((history) => [...history, cloneGameState(prev)]);
      setCanUndo(true);
      return resolved;
    });
  };

  return (
    <div key={gameKey}>
      <Header
        completed={game.completed}
        moveCount={game.moveCount}
        elapsedTime={elapsedTime}
        remainingTime={gameMode === "timed" ? remainingTime : undefined}
        mode={gameMode}
        isPaused={isPaused}
        onNewGame={() => startNewGame(gameMode)}
        onModeChange={handleModeChange}
        onPauseToggle={handlePauseToggle}
        onUndo={handleUndo}
        onHint={handleHint}
        canUndo={canUndo && !isGameOver}
        canPause={game.decks.length > 0 && !isGameOver && !isGameWon}
        interactionLocked={isGameOver}
      />
      <div className={styles.board}>
        {game.decks.slice(0, 10).map((deck, index) => (
          <CardHolder
            deck={deck}
            game={game}
            deckIndex={index}
            setGame={updateGameWithHistory}
            interactionsDisabled={isGameOver}
            key={`pile${index}`}
          />
        ))}
      </div>
      <CardBoardBottom
        game={game}
        setGame={updateGameWithHistory}
        stockDecks={game.decks.slice(10)}
        interactionsDisabled={isGameOver}
      />
    </div>
  );
};

export default CardBoard;
