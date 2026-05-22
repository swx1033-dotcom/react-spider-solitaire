import React from "react";
import Card from "./Card";
import styles from "../styles/CardHolder.module.css";
import type { GameState, Card as CardType } from "../types/game";

interface CardHolderProps {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  deck: CardType[];
  deckIndex: number;
  isPaused: boolean;
}

const CardHolder: React.FC<CardHolderProps> = ({
  game,
  setGame,
  deck,
  deckIndex,
  isPaused,
}) => {
  const validCards = deck.filter((card) => card && card.rank);

  const isEmpty = validCards.length === 0;

  return (
    <div
      className={`${styles.cardHolder} cardHolder${isEmpty ? ` ${styles.emptyColumn}` : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      id={deckIndex.toString()}
      data-deck-index={deckIndex.toString()}
      data-empty-column={isEmpty ? "true" : "false"}
      data-testid="card-holder"
    >
      {validCards.map((card, index) => (
        <Card
          data={card}
          key={`${card.rank}-${deckIndex}-${index}`}
          index={index}
          deckIndex={deckIndex}
          game={game}
          setGame={setGame}
        />
      ))}
    </div>
  );
};

export default CardHolder;
