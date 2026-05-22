import React, { useState, useEffect, useRef } from "react";
import { initiateGame, findGameHint } from "../utils/game";
import CardHolder from "./CardHolder";
import styles from "../styles/CardBoard.module.css";
import Header from "./Header";
import CardBoardBottom from "./CardBoardBottom";
import type { GameState, GameStatus } from "../types/game";
import {
  confirmNewGameWhilePaused,
  showInfo,
  showWonPopup,
} from "../utils/toaster";

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
  const [gameStatus, setGameStatus] = useState<GameStatus>("running");
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [interactionLockVersion, setInteractionLockVersion] =
    useState<number>(0);
  const winPopupScheduledRef = useRef(false);
  const gameStatusRef = useRef<GameStatus>("running");
  const elapsedBeforePauseRef = useRef<number>(0);
  const resumedAtRef = useRef<number | null>(Date.now());

  const setSessionStatus = (nextStatus: GameStatus): void => {
    gameStatusRef.current = nextStatus;
    setGameStatus(nextStatus);
  };

  const freezeInteractions = (): void => {
    setInteractionLockVersion((prev) => prev + 1);
  };

  const resetClock = (): void => {
    elapsedBeforePauseRef.current = 0;
    resumedAtRef.current = Date.now();
    setElapsedMs(0);
  };

  const stopClock = (): void => {
    if (resumedAtRef.current === null) {
      setElapsedMs(elapsedBeforePauseRef.current);
      return;
    }

    const frozenElapsed =
      elapsedBeforePauseRef.current + (Date.now() - resumedAtRef.current);
    elapsedBeforePauseRef.current = frozenElapsed;
    resumedAtRef.current = null;
    setElapsedMs(frozenElapsed);
  };

  const resumeClock = (): void => {
    resumedAtRef.current = Date.now();
  };

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
    setSessionStatus("running");
    resetClock();
    freezeInteractions();
    setGameKey((prev) => prev + 1);
  };

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    if (gameStatus !== "running") return;

    if (resumedAtRef.current === null) {
      resumedAtRef.current = Date.now();
    }

    const syncElapsed = (): void => {
      if (resumedAtRef.current === null) return;
      setElapsedMs(
        elapsedBeforePauseRef.current + (Date.now() - resumedAtRef.current),
      );
    };

    syncElapsed();
    const interval = window.setInterval(syncElapsed, 250);
    return () => window.clearInterval(interval);
  }, [gameStatus, gameKey]);

  useEffect(() => {
    if (game.completed < 8) {
      winPopupScheduledRef.current = false;
      return;
    }

    if (gameStatusRef.current !== "won") {
      stopClock();
      setSessionStatus("won");
      freezeInteractions();
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

  const handlePauseToggle = (): void => {
    if (gameStatusRef.current === "won") return;

    if (gameStatusRef.current === "running") {
      stopClock();
      setSessionStatus("paused");
      freezeInteractions();
      return;
    }

    resumeClock();
    setSessionStatus("running");
  };

  const handleNewGame = async (): Promise<void> => {
    if (gameStatusRef.current === "paused") {
      const confirmed = await confirmNewGameWhilePaused();
      if (!confirmed) return;
    }

    startNewGame();
  };

  const handleUndo = (): void => {
    if (gameStatusRef.current !== "running") return;

    setGameHistory((prev) => {
      if (prev.length === 0) return prev;
      const previousState = prev[prev.length - 1];
      setGame(previousState);
      setCanUndo(prev.length - 1 > 0);
      return prev.slice(0, -1);
    });
  };

  const handleHint = (): void => {
    if (gameStatusRef.current !== "running") return;
    showInfo(findGameHint(game.decks).text);
  };

  const updateGameWithHistory = (
    next: React.SetStateAction<GameState>,
  ): void => {
    setGame((prev) => {
      if (gameStatusRef.current !== "running") {
        return prev;
      }

      const resolved = typeof next === "function" ? next(prev) : next;
      if (resolved === prev) {
        return prev;
      }

      setGameHistory((history) => [...history, cloneGameState(prev)]);
      setCanUndo(true);
      return resolved;
    });
  };

  const isInteractionLocked = gameStatus !== "running";

  return (
    <div key={gameKey}>
      <Header
        completed={game.completed}
        moveCount={game.moveCount}
        timerSeconds={Math.floor(elapsedMs / 1000)}
        status={gameStatus}
        onNewGame={handleNewGame}
        onTogglePause={handlePauseToggle}
        onUndo={handleUndo}
        onHint={handleHint}
        canUndo={canUndo}
      />
      <div className={styles.tableauArea}>
        <div className={styles.board}>
          {game.decks.slice(0, 10).map((deck, index) => (
            <CardHolder
              deck={deck}
              game={game}
              deckIndex={index}
              setGame={updateGameWithHistory}
              isInteractionLocked={isInteractionLocked}
              interactionLockVersion={interactionLockVersion}
              key={`pile${index}`}
            />
          ))}
        </div>
        <CardBoardBottom
          game={game}
          setGame={updateGameWithHistory}
          stockDecks={game.decks.slice(10)}
          isInteractionLocked={isInteractionLocked}
        />
        {gameStatus === "paused" && (
          <div className={styles.pauseOverlay}>
            <div className={styles.pauseLabel}>Paused</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardBoard;
