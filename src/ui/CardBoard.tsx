import React, { useState, useEffect, useRef } from "react";
import {
  initiateGame,
  findGameHint,
  findMovableSources,
} from "../utils/game";
import CardHolder from "./CardHolder";
import styles from "../styles/CardBoard.module.css";
import cardStyles from "../styles/Card.module.css";
import Header from "./Header";
import CardBoardBottom from "./CardBoardBottom";
import type { GameState, Card } from "../types/game";
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
  const winPopupScheduledRef = useRef(false);
  const highlightedCardsRef = useRef<HTMLElement[]>([]);
  const highlightTimerRef = useRef<number | null>(null);
  const previousMoveCountRef = useRef(0);

  const clearHighlightedMovableCards = (): void => {
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }

    highlightedCardsRef.current.forEach((cardElement: HTMLElement) => {
      cardElement.classList.remove(cardStyles.movableSourceHighlight);
    });

    highlightedCardsRef.current = [];
  };

  useEffect(() => {
    startNewGame();

    return () => {
      clearHighlightedMovableCards();
    };
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

  useEffect(() => {
    if (previousMoveCountRef.current !== game.moveCount) {
      clearHighlightedMovableCards();
      previousMoveCountRef.current = game.moveCount;
    }
  }, [game.moveCount]);

  const startNewGame = (): void => {
    clearHighlightedMovableCards();
    const init = initiateGame();
    const newGameState: GameState = {
      decks: init.decks,
      completed: 0,
      moveCount: 0,
    };
    previousMoveCountRef.current = 0;
    setGame(newGameState);
    setGameHistory([]);
    setCanUndo(false);
    setGameKey((prev: number) => prev + 1);
  };

  const handleUndo = (): void => {
    clearHighlightedMovableCards();
    setGameHistory((prev: GameState[]) => {
      if (prev.length === 0) return prev;
      const previousState = prev[prev.length - 1];
      previousMoveCountRef.current = previousState.moveCount;
      setGame(previousState);
      setCanUndo(prev.length - 1 > 0);
      return prev.slice(0, -1);
    });
  };

  const handleHint = (): void => {
    showInfo(findGameHint(game.decks).text);
  };

  const handleHighlightMovableCards = (): void => {
    clearHighlightedMovableCards();

    const movableSources = findMovableSources(game.decks);
    if (movableSources.length === 0) {
      const nextHint = findGameHint(game.decks);
      if (nextHint.kind === "deal") {
        showInfo("当前没有可高亮的移动源牌，可以先发一列新牌。");
        return;
      }
      if (nextHint.kind === "complete") {
        showInfo("当前没有可高亮的移动源牌，但已有完整顺子等待你完成下一步。");
        return;
      }
      showInfo("当前没有可高亮的移动源牌。");
      return;
    }

    const highlightedElements = movableSources
      .map(({ deckIndex, cardIndex }) => {
        return document.querySelector(
          `[data-deck-index="${deckIndex}"][data-index="${cardIndex}"]`,
        ) as HTMLElement | null;
      })
      .filter((element): element is HTMLElement => element !== null);

    highlightedElements.forEach((element: HTMLElement) => {
      element.classList.add(cardStyles.movableSourceHighlight);
    });

    highlightedCardsRef.current = highlightedElements;
    highlightTimerRef.current = window.setTimeout(() => {
      clearHighlightedMovableCards();
    }, 3000);
  };

  const updateGameWithHistory = (
    next: React.SetStateAction<GameState>,
  ): void => {
    clearHighlightedMovableCards();
    setGame((prev: GameState) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      previousMoveCountRef.current = resolved.moveCount;
      setGameHistory((history: GameState[]) => [...history, cloneGameState(prev)]);
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
        onHighlightMoves={handleHighlightMovableCards}
        canUndo={canUndo}
        sessionKey={gameKey}
      />
      <div className={styles.board}>
        {game.decks.slice(0, 10).map((deck: Card[], index: number) => (
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
