import React, { useState, useEffect, useRef } from "react";
import {
  initiateGame,
  findGameHint,
  hasAnyLegalMove,
  isStockEmpty,
  shuffleTableau,
} from "../utils/game";
import CardHolder from "./CardHolder";
import styles from "../styles/CardBoard.module.css";
import Header from "./Header";
import CardBoardBottom from "./CardBoardBottom";
import { GameState, MAX_SHUFFLE_COUNT } from "../types/game";
import { showInfo, showWonPopup, showShufflePrompt } from "../utils/toaster";

const cloneGameState = (g: GameState): GameState => ({
  completed: g.completed,
  moveCount: g.moveCount,
  shuffleCount: g.shuffleCount,
  decks: g.decks.map((col) => col.map((c) => ({ ...c }))),
});

const CardBoard: React.FC = () => {
  const [game, setGame] = useState<GameState>({
    decks: [],
    completed: 0,
    moveCount: 0,
    shuffleCount: MAX_SHUFFLE_COUNT,
  });
  const [, setGameHistory] = useState<GameState[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [gameKey, setGameKey] = useState<number>(0);
  const winPopupScheduledRef = useRef(false);
  const deadlockPromptShownRef = useRef(false);
  const isInitialLoadRef = useRef(true);

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
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    if (game.completed >= 8) return;
    if (game.decks.length === 0) return;
    if (deadlockPromptShownRef.current) return;

    const noMoves = !hasAnyLegalMove(game.decks);
    const stockEmpty = isStockEmpty(game.decks);

    if (noMoves && stockEmpty) {
      deadlockPromptShownRef.current = true;
      showShufflePrompt(
        "无可用移动，是否重新洗牌并保留当前进度？",
        () => {
          handleShuffle();
        },
      );
    }
  }, [game]);

  const startNewGame = (): void => {
    const init = initiateGame();
    const newGameState: GameState = {
      decks: init.decks,
      completed: 0,
      moveCount: 0,
      shuffleCount: MAX_SHUFFLE_COUNT,
    };
    setGame(newGameState);
    setGameHistory([]);
    setCanUndo(false);
    setGameKey((prev) => prev + 1);
    deadlockPromptShownRef.current = false;
    isInitialLoadRef.current = true;
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

  const handleShuffle = (): void => {
    if (game.shuffleCount <= 0) return;
    const shuffledDecks = shuffleTableau(game.decks);
    setGame((prev) => ({
      ...prev,
      decks: [...shuffledDecks, ...prev.decks.slice(10)],
      shuffleCount: prev.shuffleCount - 1,
      moveCount: prev.moveCount + 1,
    }));
    setGameHistory([]);
    setCanUndo(false);
    deadlockPromptShownRef.current = false;
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
        canUndo={canUndo}
        sessionKey={gameKey}
        onShuffle={() => {
          if (game.shuffleCount <= 0) return;
          showShufflePrompt(
            "Reshuffle the tableau? This will clear your undo history.",
            () => {
              handleShuffle();
            },
          );
        }}
        shuffleRemaining={game.shuffleCount}
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
