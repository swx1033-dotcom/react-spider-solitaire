import React, { useState, useEffect, useRef, useCallback } from "react";
import { initiateGame, findGameHint } from "../utils/game";
import CardHolder from "./CardHolder";
import styles from "../styles/CardBoard.module.css";
import Header, { GameMode } from "./Header";
import CardBoardBottom from "./CardBoardBottom";
import { GameState } from "../types/game";
import { showInfo, showWonPopup, showTimeoutPopup } from "../utils/toaster";

const cloneGameState = (g: GameState): GameState => ({
  completed: g.completed,
  moveCount: g.moveCount,
  shuffleCount: g.shuffleCount,
  decks: g.decks.map((col) => col.map((c) => ({ ...c }))),
  mode: g.mode,
  isPaused: g.isPaused,
  isGameOver: g.isGameOver,
});

const CardBoard: React.FC = () => {
  const [game, setGame] = useState<GameState>({
    decks: [],
    completed: 0,
    moveCount: 0,
    shuffleCount: 0,
    mode: "classic",
    isPaused: false,
    isGameOver: false,
  });
  const [, setGameHistory] = useState<GameState[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [gameKey, setGameKey] = useState<number>(0);
  const [remainingTimeAtWin, setRemainingTimeAtWin] = useState<number | undefined>();
  const winPopupScheduledRef = useRef(false);

  useEffect(() => {
    startNewGame("classic");
  }, []);

  useEffect(() => {
    if (game.completed < 8 || game.isGameOver) {
      winPopupScheduledRef.current = false;
      return;
    }
    if (winPopupScheduledRef.current) return;
    winPopupScheduledRef.current = true;
    
    // Mark game as over
    setGame(prev => ({ ...prev, isGameOver: true }));
    
    const t = window.setTimeout(() => {
      showWonPopup(() => {
        winPopupScheduledRef.current = false;
        startNewGame(game.mode);
      }, undefined);
    }, 500);
    return () => window.clearTimeout(t);
  }, [game.completed, game.isGameOver, game.mode, startNewGame]);

  const startNewGame = useCallback((mode: GameMode = "classic"): void => {
    const init = initiateGame(mode);
    const newGameState: GameState = {
      decks: init.decks,
      completed: 0,
      moveCount: 0,
      shuffleCount: 0,
      mode: mode,
      isPaused: false,
      isGameOver: false,
    };
    setGame(newGameState);
    setGameHistory([]);
    setCanUndo(false);
    setRemainingTimeAtWin(undefined);
    setGameKey((prev) => prev + 1);
  }, []);

  const handleModeChange = useCallback((newMode: GameMode): void => {
    if (newMode !== game.mode) {
      startNewGame(newMode);
    }
  }, [game.mode, startNewGame]);

  const handlePauseToggle = useCallback((): void => {
    setGame(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  const handleTimeout = useCallback((): void => {
    setGame(prev => ({
      ...prev,
      isGameOver: true,
    }));
    showTimeoutPopup(() => {
      startNewGame(game.mode);
    });
  }, [game.mode, startNewGame]);

  const handleUndo = (): void => {
    if (game.isGameOver || game.isPaused) return;
    setGameHistory((prev) => {
      if (prev.length === 0) return prev;
      const previousState = prev[prev.length - 1];
      setGame(previousState);
      setCanUndo(prev.length - 1 > 0);
      return prev.slice(0, -1);
    });
  };

  const handleHint = (): void => {
    if (game.isGameOver || game.isPaused) return;
    showInfo(findGameHint(game.decks).text);
  };

  const updateGameWithHistory = (
    next: React.SetStateAction<GameState>,
  ): void => {
    if (game.isGameOver || game.isPaused) return;
    
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
        onNewGame={() => startNewGame(game.mode)}
        onUndo={handleUndo}
        onHint={handleHint}
        canUndo={canUndo}
        mode={game.mode}
        onModeChange={handleModeChange}
        isPaused={game.isPaused}
        onPauseToggle={handlePauseToggle}
        isGameOver={game.isGameOver}
        onTimeout={handleTimeout}
        sessionKey={gameKey}
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
