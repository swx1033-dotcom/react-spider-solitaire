import React, { useState, useEffect, useRef } from "react";
import { initiateGame, findGameHint, hasAnyValidMoves, smartShuffle } from "../utils/game";
import CardHolder from "./CardHolder";
import styles from "../styles/CardBoard.module.css";
import Header from "./Header";
import CardBoardBottom from "./CardBoardBottom";
import { GameState } from "../types/game";
import { showInfo, showWonPopup, showShuffleConfirmPopup } from "../utils/toaster";

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
    shuffleCount: 0,
  });
  const [, setGameHistory] = useState<GameState[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [gameKey, setGameKey] = useState<number>(0);
  const winPopupScheduledRef = useRef(false);
  const shufflePromptShownRef = useRef(false);

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
      shuffleCount: 0,
    };
    setGame(newGameState);
    setGameHistory([]);
    setCanUndo(false);
    setGameKey((prev) => prev + 1);
    shufflePromptShownRef.current = false;
  };

  const handleUndo = (): void => {
    setGameHistory((prev) => {
      if (prev.length === 0) return prev;
      const previousState = prev[prev.length - 1];
      setGame(previousState);
      setCanUndo(prev.length - 1 > 0);
      shufflePromptShownRef.current = false;
      return prev.slice(0, -1);
    });
  };

  const handleHint = (): void => {
    showInfo(findGameHint(game.decks).text);
  };

  const handleShuffle = (): void => {
    if (game.shuffleCount >= 3) return;
    
    const performShuffle = (): void => {
      const newDecks = smartShuffle(game.decks);
      setGame({
        ...game,
        decks: newDecks,
        shuffleCount: game.shuffleCount + 1,
      });
      setGameHistory([]);
      setCanUndo(false);
      shufflePromptShownRef.current = false;
    };
    
    showShuffleConfirmPopup(performShuffle, game.shuffleCount);
  };

  const checkGameStateAndPromptShuffle = (): void => {
    if (game.completed >= 8) return;
    if (shufflePromptShownRef.current) return;
    if (game.shuffleCount >= 3) return;
    
    const stockHasCards = game.decks.slice(10, 15).some((d) => (d?.length ?? 0) > 0);
    if (stockHasCards) return;
    
    if (!hasAnyValidMoves(game.decks)) {
      shufflePromptShownRef.current = true;
      handleShuffle();
    }
  };

  const updateGameWithHistory = (
    next: React.SetStateAction<GameState>,
  ): void => {
    setGame((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      setGameHistory((h) => [...h, cloneGameState(prev)]);
      setCanUndo(true);
      shufflePromptShownRef.current = false;
      return resolved;
    });
  };

  useEffect(() => {
    checkGameStateAndPromptShuffle();
  }, [game.decks, game.moveCount]);

  return (
    <div key={gameKey}>
      <Header
        completed={game.completed}
        moveCount={game.moveCount}
        shuffleCount={game.shuffleCount}
        onNewGame={startNewGame}
        onUndo={handleUndo}
        onHint={handleHint}
        onShuffle={handleShuffle}
        canUndo={canUndo}
        canShuffle={game.shuffleCount < 3 && game.completed < 8}
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
