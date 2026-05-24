import React, { useState, useEffect, useRef, useCallback } from "react";
import { initiateGame, findGameHint, findMovableCards, type MovableCard } from "../utils/game";
import CardHolder from "./CardHolder";
import styles from "../styles/CardBoard.module.css";
import Header from "./Header";
import CardBoardBottom from "./CardBoardBottom";
import { GameState } from "../types/game";
import { showInfo, showWonPopup, showNoMoves } from "../utils/toaster";

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
  
  // 高亮相关的状态和引用
  const highlightTimeoutRef = useRef<number | null>(null);
  const previousMoveCountRef = useRef<number>(0);
  const previousGameKeyRef = useRef<number>(0);

  useEffect(() => {
    startNewGame();
  }, []);

  // 监听游戏移动和新游戏，清除高亮
  useEffect(() => {
    if (
      game.moveCount !== previousMoveCountRef.current ||
      gameKey !== previousGameKeyRef.current
    ) {
      clearHighlights();
      previousMoveCountRef.current = game.moveCount;
      previousGameKeyRef.current = gameKey;
    }
  }, [game.moveCount, gameKey, clearHighlights]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearHighlights();
    };
  }, [clearHighlights]);

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

  // 清除高亮的辅助函数
  const clearHighlights = useCallback((): void => {
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
    const allCards = document.querySelectorAll(".card");
    allCards.forEach((card) => {
      card.setAttribute("data-highlighted", "false");
    });
  }, []);

  // 为指定的卡片添加高亮
  const applyHighlights = useCallback((movableCards: MovableCard[]): void => {
    movableCards.forEach(({ deckIndex, cardIndex }) => {
      const cardElement = document.querySelector(
        `.card[data-deck-index="${deckIndex}"][data-index="${cardIndex}"]`
      ) as HTMLElement;
      if (cardElement) {
        cardElement.setAttribute("data-highlighted", "true");
      }
    });
  }, []);

  // 处理高亮按钮点击的主要函数
  const handleHighlight = useCallback((): void => {
    // 先清除现有的高亮和计时器
    clearHighlights();

    // 扫描所有可移动牌
    const movableCards = findMovableCards(game.decks);

    if (movableCards.length === 0) {
      showNoMoves("No moves available right now.");
      return;
    }

    // 应用高亮
    applyHighlights(movableCards);

    // 设置3秒后自动清除
    highlightTimeoutRef.current = window.setTimeout(() => {
      clearHighlights();
    }, 3000);
  }, [game.decks, clearHighlights, applyHighlights]);

  const updateGameWithHistory = (
    next: React.SetStateAction<GameState>,
  ): void => {
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
