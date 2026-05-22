import React from "react";
import styles from "../styles/CardBoardBottom.module.css";
import StockCards from "./StockCards";
import type { GameState, Card } from "../types/game";

interface CardBoardBottomProps {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  stockDecks: Card[][];
  interactionsDisabled?: boolean;
}

const CardBoardBottom: React.FC<CardBoardBottomProps> = ({
  game,
  setGame,
  stockDecks,
  interactionsDisabled = false,
}) => {
  return (
    <div className={styles.bottomCardBoard}>
      {stockDecks.map((stockDeck, index) => (
        <StockCards
          key={index}
          game={game}
          setGame={setGame}
          deck={stockDeck}
          index={index}
          interactionsDisabled={interactionsDisabled}
        />
      ))}
    </div>
  );
};

export default CardBoardBottom;
