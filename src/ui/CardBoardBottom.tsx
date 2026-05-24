import React from "react";
import styles from "../styles/CardBoardBottom.module.css";
import StockCards from "./StockCards";
import type { GameState, Card } from "../types/game";

interface CardBoardBottomProps {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  stockDecks: Card[][];
  isPaused: boolean;
}

const CardBoardBottom: React.FC<CardBoardBottomProps> = ({
  game,
  setGame,
  stockDecks,
  isPaused,
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
          isPaused={isPaused}
        />
      ))}
    </div>
  );
};

export default CardBoardBottom;