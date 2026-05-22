import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  initiateGame,
  findGameHint,
  analyzeMoveAvailability,
  reshuffleTableau,
  MAX_RESHUFFLES,
  TABLEAU_COLUMN_COUNT,
} from "../utils/game";
import CardHolder from "./CardHolder";
import styles from "../styles/CardBoard.module.css";
import Header from "./Header";
import CardBoardBottom from "./CardBoardBottom";
import { GameState } from "../types/game";
import { showInfo, showWonPopup, confirmReshuffle } from "../utils/toaster";

const cloneGameState = (g: GameState): GameState => ({
  completed: g.completed,
  moveCount: g.moveCount,
  reshufflesUsed: g.reshufflesUsed,
  decks: g.decks.map((col) => col.map((c) => ({ ...c }))),
});

const getBoardSignature = (decks: GameState["decks"]): string =>
  decks
    .map((column) =>
      column.map((card) => `${card.rank}${card.isDown ? "d" : "u"}`).join("."),
    )
    .join("|");

const CardBoard: React.FC = () => {
  const [game, setGame] = useState<GameState>({
    decks: [],
    completed: 0,
    moveCount: 0,
    reshufflesUsed: 0,
  });
  const [gameHistory, setGameHistory] = useState<GameState[]>([]);
  const [gameKey, setGameKey] = useState<number>(0);
  const winPopupScheduledRef = useRef(false);
  const reshufflePromptOpenRef = useRef(false);
  const lastStuckBoardRef = useRef<string>("");

  const clearHistory = useCallback((): void => {
    setGameHistory([]);
  }, []);

  const startNewGame = useCallback((): void => {
    const init = initiateGame();
    const newGameState: GameState = {
      decks: init.decks,
      completed: 0,
      moveCount: 0,
      reshufflesUsed: 0,
    };
    setGame(newGameState);
    clearHistory();
    setGameKey((prev) => prev + 1);
    reshufflePromptOpenRef.current = false;
    lastStuckBoardRef.current = "";
  }, [clearHistory]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

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
  }, [game.completed, startNewGame]);

  const triggerReshuffle = useCallback(
    (snapshot: GameState): void => {
      if (snapshot.reshufflesUsed >= MAX_RESHUFFLES) {
        return;
      }

      setGame({
        ...snapshot,
        decks: reshuffleTableau(snapshot.decks),
        reshufflesUsed: snapshot.reshufflesUsed + 1,
      });
      clearHistory();
      lastStuckBoardRef.current = "";
    },
    [clearHistory],
  );

  useEffect(() => {
    if (game.decks.length < TABLEAU_COLUMN_COUNT || game.completed >= 8) {
      return;
    }

    const availability = analyzeMoveAvailability(game.decks);
    if (availability.hasTableauMove || availability.hasStockCards) {
      lastStuckBoardRef.current = "";
      return;
    }

    const boardSignature = getBoardSignature(game.decks);
    if (
      reshufflePromptOpenRef.current ||
      lastStuckBoardRef.current === boardSignature
    ) {
      return;
    }

    lastStuckBoardRef.current = boardSignature;

    if (game.reshufflesUsed >= MAX_RESHUFFLES) {
      showInfo("当前无可用移动，且本局洗牌次数已用完，请尝试撤销或开始新游戏。");
      return;
    }

    reshufflePromptOpenRef.current = true;
    void confirmReshuffle().then((confirmed) => {
      reshufflePromptOpenRef.current = false;
      if (confirmed) {
        triggerReshuffle(game);
      }
    });
  }, [game.completed, game.decks, game.reshufflesUsed, triggerReshuffle]);

  const handleUndo = (): void => {
    setGameHistory((prev) => {
      if (prev.length === 0) return prev;
      const previousState = prev[prev.length - 1];
      setGame(previousState);
      return prev.slice(0, -1);
    });
  };

  const handleHint = (): void => {
    showInfo(findGameHint(game.decks).text);
  };

  const handleManualReshuffle = (): void => {
    if (game.reshufflesUsed >= MAX_RESHUFFLES) {
      showInfo("本局最多只能洗牌 3 次，请尝试撤销或开始新游戏。");
      return;
    }

    triggerReshuffle(game);
  };

  const updateGameWithHistory = (
    next: React.SetStateAction<GameState>,
  ): void => {
    setGame((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      setGameHistory((history) => [...history, cloneGameState(prev)]);
      return resolved;
    });
  };

  return (
    <div key={gameKey}>
      <Header
        completed={game.completed}
        moveCount={game.moveCount}
        reshufflesUsed={game.reshufflesUsed}
        maxReshuffles={MAX_RESHUFFLES}
        onNewGame={startNewGame}
        onUndo={handleUndo}
        onHint={handleHint}
        onReshuffle={handleManualReshuffle}
        canUndo={gameHistory.length > 0}
        canReshuffle={game.reshufflesUsed < MAX_RESHUFFLES}
        sessionKey={gameKey}
      />
      <div className={styles.board}>
        {game.decks.slice(0, TABLEAU_COLUMN_COUNT).map((deck, index) => (
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
        stockDecks={game.decks.slice(TABLEAU_COLUMN_COUNT)}
      />
    </div>
  );
};

export default CardBoard;
