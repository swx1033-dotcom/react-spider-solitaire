import React, { useState, useEffect, useRef } from "react";
import { initiateGame, findGameHint } from "../utils/game";
import CardHolder from "./CardHolder";
import styles from "../styles/CardBoard.module.css";
import Header from "./Header";
import CardBoardBottom from "./CardBoardBottom";
import type { GameState, GameMode } from "../types/game";
import { showInfo, showWonPopup, showTimeUpPopup } from "../utils/toaster";

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
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const winPopupScheduledRef = useRef(false);
  const timerRef = useRef<{ elapsed: number; remaining: number }>({
    elapsed: 0,
    remaining: 0,
  });

  useEffect(() => {
    startNewGame(gameMode);
  }, []);

  useEffect(() => {
    if (game.completed < 8) {
      winPopupScheduledRef.current = false;
      return;
    }
    if (winPopupScheduledRef.current) return;
    winPopupScheduledRef.current = true;
    const t = window.setTimeout(() => {
      const remainingTime =
        gameMode === "challenge" ? timerRef.current.remaining : undefined;
      showWonPopup(() => {
        winPopupScheduledRef.current = false;
        startNewGame(gameMode);
      }, remainingTime);
    }, 500);
    return () => window.clearTimeout(t);
  }, [game.completed, gameMode]);

  const startNewGame = (mode: GameMode = gameMode): void => {
    const init = initiateGame(mode);
    const newGameState: GameState = {
      decks: init.decks,
      completed: 0,
      moveCount: 0,
    };
    setGame(newGameState);
    setGameHistory([]);
    setCanUndo(false);
    setIsGameOver(false);
    setGameKey((prev) => prev + 1);
  };

  const handleUndo = (): void => {
    setGameHistory((prev) => {
      if (prev.length === 0) return prev;
      const previousState = prev[prev.length - 1];
      setGame(previousState);
      setCanUndo(prev.length - 1 > 0);
      return prev.slice(0, -1);
    });
  };

  const handleHint = (): void => {
    showInfo(findGameHint(game.decks).text);
  };

  const handleTimeUp = (): void => {
    setIsGameOver(true);
    showTimeUpPopup(() => {
      startNewGame(gameMode);
    });
  };

  const handleSwitchMode = (mode: GameMode): void => {
    setGameMode(mode);
    const init = initiateGame(mode);
    const newGameState: GameState = {
      decks: init.decks,
      completed: 0,
      moveCount: 0,
    };
    setGame(newGameState);
    setGameHistory([]);
    setCanUndo(false);
    setIsGameOver(false);
    setGameKey((prev) => prev + 1);
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
        onNewGame={() => startNewGame(gameMode)}
        onUndo={handleUndo}
        onHint={handleHint}
        canUndo={canUndo && !isGameOver}
        sessionKey={gameKey}
        gameMode={gameMode}
        onSwitchMode={handleSwitchMode}
        isGameOver={isGameOver}
        onTimeUp={handleTimeUp}
        timerRef={timerRef}
      />
      <div className={styles.board}>
        {game.decks.slice(0, 10).map((deck, index) => (
          <CardHolder
            deck={deck}
            game={game}
            deckIndex={index}
            setGame={updateGameWithHistory}
            key={`pile${index}`}
            disabled={isGameOver}
          />
        ))}
      </div>
      <CardBoardBottom
        game={game}
        setGame={updateGameWithHistory}
        stockDecks={game.decks.slice(10)}
        disabled={isGameOver}
      />
    </div>
  );
};

export default CardBoard;