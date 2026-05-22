import React, { useState, useEffect, useRef, useCallback } from "react";
import { initiateGame, findGameHint, hasLegalMoves, shuffleTableau } from "../utils/game";
import CardHolder from "./CardHolder";
import styles from "../styles/CardBoard.module.css";
import Header from "./Header";
import CardBoardBottom from "./CardBoardBottom";
import { GameState } from "../types/game";
import { showInfo, showWonPopup, showShufflePopup, showShuffleLimitPopup } from "../utils/toaster";

const MAX_SHUFFLES = 3;

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
  const [shuffleCount, setShuffleCount] = useState<number>(0);
  const winPopupScheduledRef = useRef(false);
  const deadlockCheckRef = useRef(false);

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

  useEffect(() => {
    if (game.decks.length === 0) return;
    if (game.completed >= 8) return;
    if (deadlockCheckRef.current) return;

    const stockEmpty = !game.decks.slice(10, 15).some((d) => (d?.length ?? 0) > 0);
    if (!stockEmpty) return;

    if (hasLegalMoves(game.decks)) return;

    deadlockCheckRef.current = true;
    const remaining = MAX_SHUFFLES - shuffleCount;
    if (remaining <= 0) {
      showInfo("无可用移动，且洗牌次数已用完。请开始新游戏。");
      deadlockCheckRef.current = false;
      return;
    }

    const t = window.setTimeout(() => {
      showShufflePopup(() => {
        performShuffle();
        deadlockCheckRef.current = false;
      }, remaining);
      deadlockCheckRef.current = false;
    }, 300);
    return () => window.clearTimeout(t);
  }, [game.decks, game.completed, shuffleCount]);

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
    setShuffleCount(0);
    deadlockCheckRef.current = false;
  };

  const performShuffle = useCallback((): void => {
    setShuffleCount((prev) => {
      if (prev >= MAX_SHUFFLES) {
        showShuffleLimitPopup();
        return prev;
      }
      const nextCount = prev + 1;
      setGame((g) => {
        const shuffledDecks = shuffleTableau(g.decks);
        return {
          ...g,
          decks: shuffledDecks,
          moveCount: g.moveCount + 1,
        };
      });
      setGameHistory([]);
      setCanUndo(false);
      return nextCount;
    });
  }, []);

  const handleShuffle = (): void => {
    if (shuffleCount >= MAX_SHUFFLES) {
      showShuffleLimitPopup();
      return;
    }
    performShuffle();
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
        onShuffle={handleShuffle}
        canUndo={canUndo}
        shuffleCount={shuffleCount}
        maxShuffles={MAX_SHUFFLES}
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
