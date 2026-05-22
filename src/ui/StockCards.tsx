import React, { useState, useEffect } from "react";
import styles from "../styles/StockCards.module.css";
import type { GameState, Card } from "../types/game";

interface StockCardsProps {
  index: number;
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  deck: Card[];
}

const StockCards: React.FC<StockCardsProps> = ({
  index,
  game,
  setGame,
  deck,
}) => {
  const [isShown, setIsShown] = useState<boolean>(true);
  const isDisabled = game.isGameOver || game.isPaused;

  useEffect(() => {
    setIsShown(true);
  }, [game.decks]);

  const handleCardSplit = (): void => {
    if (isDisabled || !deck || deck.length === 0) return;

    const tempDecks = game.decks.map((col) => [...col]);

    const cardsToDeal = deck.map((card) => ({ ...card, isDown: false }));

    for (let i = 0; i < 10 && i < cardsToDeal.length; i++) {
      tempDecks[i].push(cardsToDeal[i]);
    }

    tempDecks[10 + index] = [];

    setGame((prevState) => ({
      ...prevState,
      decks: tempDecks,
      moveCount: prevState.moveCount + 1,
    }));

    setIsShown(false);
  };

  if (!deck || deck.length === 0) return null;

  const remainingStockPiles = game.decks
    .slice(10)
    .filter((p) => p.length > 0).length;

  return (
    <>
      {isShown && (
        <div
          className={`${styles.stockDeck} ${isDisabled ? styles.disabled : ''}`}
          data-index={index.toString()}
          data-stock-remaining={remainingStockPiles}
          role="button"
          tabIndex={isDisabled ? -1 : 0}
          title={isDisabled ? "Game is paused or over" : `Deal one face-up card to each column (${deck.length} in this pile, ${remainingStockPiles} stock pile(s) left)`}
          aria-label={isDisabled ? "Game is paused or over" : `Deal row from stock pile ${index + 1}, ${deck.length} cards in pile`}
          onClick={handleCardSplit}
          onKeyDown={(e) => {
            if (!isDisabled && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              handleCardSplit();
            }
          }}
          style={{ cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.5 : 1 }}
        />
      )}
    </>
  );
};

export default StockCards;
