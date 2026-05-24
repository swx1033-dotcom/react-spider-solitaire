import React, { useState, useEffect, useRef, useCallback } from "react";
import { initiateGame, findGameHint, findMovableCards } from "../utils/game";
import CardHolder from "./CardHolder";
import styles from "../styles/CardBoard.module.css";
import Header from "./Header";
import CardBoardBottom from "./CardBoardBottom";
import { GameState, Card } from "../types/game";
import { showInfo, showWonPopup } from "../utils/toaster";

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
  const [highlightedCards, setHighlightedCards] = useState<
    { deckIndex: number; cardIndex: number }[]
  >([]);
  const highlightTimerRef = useRef<number | null>(null);
  const winPopupScheduledRef = useRef(false);

  const clearHighlight = useCallback(() => {
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
    setHighlightedCards([]);
  }, []);

  const handleHighlight = useCallback(() => {
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
    }

    const movableCards = findMovableCards(game.decks);
    if (movableCards.length === 0) {
      showInfo("No movable cards available");
      return;
    }

    setHighlightedCards(movableCards);
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedCards([]);
      highlightTimerRef.current = null;
    }, 3000);
  }, [game.decks]);

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
      showWonPopup(() => {
        winPopupScheduledRef.current = false;
        startNewGame();
      });
    }, 500);
    return () => window.clearTimeout(t);
  }, [game.completed]);

  const startNewGame = (): void => {
    clearHighlight();
    const init = initiateGame();
    const newGameState: GameState = {
      decks: init.decks,
      completed: 0,
      moveCount: 0,
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
    clearHighlight();
    setGame((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      setGameHistory((h) => [...h, cloneGameState(prev)]);
      setCanUndo(true);
      return resolved;
    });
  };

  const isCardHighlighted = (deckIndex: number, cardIndex: number): boolean => {
    return highlightedCards.some(
      (h) => h.deckIndex === deckIndex && h.cardIndex === cardIndex,
    );
  };

  return (
    <div key={gameKey}>
      <Header
        completed={game.completed}
        moveCount={game.moveCount}
        onNewGame={startNewGame}
        onUndo={handleUndo}
        onHint={handleHint}
        onHighlight={handleHighlight}
        canUndo={canUndo}
        sessionKey={gameKey}
      />
      <div className={styles.board}>
        {game.decks.slice(0, 10).map((deck, index) => (
          <CardHolder
            deck={deck}
            game={game}
            deckIndex={index}
            setGame={updateGameWithHistory}
            highlightedCards={highlightedCards.filter(
              (h) => h.deckIndex === index,
            )}
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
