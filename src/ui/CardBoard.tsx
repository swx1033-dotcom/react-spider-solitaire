import React, { useState, useEffect, useRef } from "react";
import _ from "lodash";
import { initiateGame, findGameHint } from "../utils/game";
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
  const [shufflesRemaining, setShufflesRemaining] = useState<number>(3);
  const winPopupScheduledRef = useRef(false);
  const stuckPromptedRef = useRef(false);

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
    setShufflesRemaining(3);
    stuckPromptedRef.current = false;
    setGameKey((prev) => prev + 1);
  };

  const handleUndo = (): void => {
    setGameHistory((prev) => {
      if (prev.length === 0) return prev;
      const previousState = prev[prev.length - 1];
      setGame(previousState);
      setCanUndo(prev.length - 1 > 0);
      stuckPromptedRef.current = false;
      return prev.slice(0, -1);
    });
  };

  const handleShuffle = (): void => {
    if (shufflesRemaining <= 0) return;
    setShufflesRemaining((prev) => prev - 1);
    
    setGame((prev) => {
      const tableCards: Card[] = [];
      const colCounts: number[] = [];
      for (let i = 0; i < 10; i++) {
        colCounts.push(prev.decks[i]?.length || 0);
        const col = prev.decks[i] || [];
        for (const c of col) {
          tableCards.push({ ...c, isDown: false });
        }
      }
      
      const shuffledCards = _.shuffle(tableCards);
      const newDecks = [...prev.decks];
      let cardIdx = 0;
      for (let i = 0; i < 10; i++) {
        newDecks[i] = shuffledCards.slice(cardIdx, cardIdx + colCounts[i]);
        cardIdx += colCounts[i];
      }
      
      return {
        ...prev,
        decks: newDecks,
        moveCount: prev.moveCount + 1,
      };
    });
    
    setGameHistory([]);
    setCanUndo(false);
    stuckPromptedRef.current = false;
  };

  useEffect(() => {
    if (game.completed >= 8) return;
    if (game.decks.length === 0) return;
    
    const hint = findGameHint(game.decks);
    if (hint.kind !== "stuck") {
      stuckPromptedRef.current = false;
    } else if (hint.kind === "stuck" && !stuckPromptedRef.current) {
      stuckPromptedRef.current = true;
      const t = window.setTimeout(() => {
        if (shufflesRemaining > 0) {
          const wantsShuffle = window.confirm("无可用移动，是否重新洗牌并保留当前进度？");
          if (wantsShuffle) {
            handleShuffle();
          }
        }
      }, 100);
      return () => window.clearTimeout(t);
    }
  }, [game.decks, game.completed, shufflesRemaining]);

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
        shufflesRemaining={shufflesRemaining}
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
