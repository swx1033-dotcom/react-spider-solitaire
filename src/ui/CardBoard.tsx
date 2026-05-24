import React, { useState, useEffect, useRef, useCallback } from "react";
import { initiateGame, findGameHint, findAllMovableSources } from "../utils/game";
import CardHolder from "./CardHolder";
import styles from "../styles/CardBoard.module.css";
import cardStyles from "../styles/Card.module.css";
import Header from "./Header";
import CardBoardBottom from "./CardBoardBottom";
import { GameState } from "../types/game";
import { showInfo, showWonPopup, showNotification } from "../utils/toaster";

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
  const winPopupScheduledRef = useRef(false);
  const highlightTimerRef = useRef<number | null>(null);
  const highlightedElementsRef = useRef<HTMLElement[]>([]);

  const clearHighlights = useCallback((): void => {
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
    highlightedElementsRef.current.forEach((el) => {
      el.classList.remove(cardStyles.highlightMovable);
    });
    highlightedElementsRef.current = [];
  }, []);

  const handleHighlightMovable = useCallback((): void => {
    clearHighlights();

    const sources = findAllMovableSources(game.decks);

    if (sources.length === 0) {
      showNotification(
        "No movable cards found — try dealing from stock or Undo.",
      );
      return;
    }

    const elements: HTMLElement[] = [];
    for (const { deckIndex, cardIndex } of sources) {
      const el = document.querySelector(
        `[data-deck-index="${deckIndex}"][data-index="${cardIndex}"]`,
      ) as HTMLElement | null;
      if (el) {
        el.classList.add(cardStyles.highlightMovable);
        elements.push(el);
      }
    }
    highlightedElementsRef.current = elements;

    highlightTimerRef.current = window.setTimeout(() => {
      clearHighlights();
    }, 3000);
  }, [game.decks, clearHighlights]);

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
    clearHighlights();
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
        onHighlightMovable={handleHighlightMovable}
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
