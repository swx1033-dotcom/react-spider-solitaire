import React, { useState, useEffect, useRef } from "react";
import { initiateGame, findGameHint } from "../utils/game";
import CardHolder from "./CardHolder";
import styles from "../styles/CardBoard.module.css";
import Header from "./Header";
import CardBoardBottom from "./CardBoardBottom";
import { GameState, GameMode } from "../types/game";
import { showInfo, showWonPopup, showError, showFailPopup } from "../utils/toaster";

const cloneGameState = (g: GameState): GameState => ({
  completed: g.completed,
  moveCount: g.moveCount,
  mode: g.mode,
  isGameOver: g.isGameOver,
  decks: g.decks.map((col) => col.map((c) => ({ ...c }))),
});

const CardBoard: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [game, setGame] = useState<GameState>({
    decks: [],
    completed: 0,
    moveCount: 0,
    mode: "classic",
    isGameOver: false,
  });
  const [, setGameHistory] = useState<GameState[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [gameKey, setGameKey] = useState<number>(0);
  const winPopupScheduledRef = useRef(false);
  const timeRef = useRef<number>(0);

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
    const t = window.setTimeout(() => {
      const timeMessage = game.mode === "time_attack" 
        ? `Remaining Time: ${timeRef.current}s` 
        : `Time Taken: ${timeRef.current}s`;
      showWonPopup(() => {
        winPopupScheduledRef.current = false;
        startNewGame();
      }, timeMessage);
    }, 500);
    return () => window.clearTimeout(t);
  }, [game.completed, game.mode]);

  const handleTimeUp = () => {
    setGame((prev) => ({ ...prev, isGameOver: true }));
    showFailPopup("Time is up!", () => {
      startNewGame();
    });
  };

  const startNewGame = (modeOverride?: GameMode): void => {
    const currentMode = modeOverride ?? gameMode;
    if (modeOverride) setGameMode(modeOverride);
    
    const init = initiateGame(currentMode);
    const newGameState: GameState = {
      decks: init.decks,
      completed: 0,
      moveCount: 0,
      mode: currentMode,
      isGameOver: false,
    };
    setGame(newGameState);
    setGameHistory([]);
    setCanUndo(false);
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

  const updateGameWithHistory = (
    next: React.SetStateAction<GameState>,
  ): void => {
    if (game.isGameOver) return;
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
        onNewGame={() => startNewGame()}
        onUndo={handleUndo}
        onHint={handleHint}
        canUndo={canUndo}
        sessionKey={gameKey}
        mode={gameMode}
        onModeChange={(newMode) => startNewGame(newMode)}
        onTimeUp={handleTimeUp}
        isGameOver={game.isGameOver}
        timeRef={timeRef}
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
