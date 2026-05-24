import React from "react";
import {
  getRank,
  checkCompletedSet,
  isValidMove,
  isValidDescendingRun,
} from "../utils/game";
import type { GameState, Card as CardType } from "../types/game";
import styles from "../styles/Card.module.css";

interface CardProps {
  data: CardType;
  index: number;
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  deckIndex: number;
}

const Card: React.FC<CardProps> = ({
  data,
  index,
  game,
  setGame,
  deckIndex,
}) => {
  if (!data || !data.rank) return null;

  const column = game.decks[deckIndex] ?? [];
  const canDrag = !data.isDown && isValidDescendingRun(column, index);

  let mouseX: number;
  let mouseY: number;
  let selectedCards: HTMLElement[] = [];

  const dragStart = (event: React.DragEvent<HTMLDivElement>): void => {
    if (!canDrag) {
      event.preventDefault();
      return;
    }

    const currentCard = event.currentTarget;
    const currentCardIndex = parseInt(
      currentCard.getAttribute("data-index") || "0",
    );

    selectedCards.length = 0;
    selectedCards.push(currentCard);

    let currentRank = getRank(
      currentCard.getAttribute("data-original-rank") || "0",
    );

    const colLen = column.length;
    for (let i = currentCardIndex + 1; i < colLen; i++) {
      const cardElement = document.querySelector(
        `[data-deck-index="${deckIndex}"][data-index="${i}"]`,
      ) as HTMLElement;
      if (!cardElement) break;
      if (cardElement.getAttribute("data-isdown") === "true") break;
      const siblingRank = getRank(
        cardElement.getAttribute("data-original-rank") || "0",
      );
      if (currentRank !== siblingRank + 1) break;
      selectedCards.push(cardElement);
      currentRank = siblingRank;
    }

    mouseX = event.pageX;
    mouseY = event.pageY;
  };

  const dragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  const drag = (event: React.DragEvent<HTMLDivElement>): void => {
    const diffX = event.pageX - mouseX;
    const diffY = event.pageY - mouseY;
    selectedCards.forEach((card, index) => {
      card.classList.add(styles.dragging);
      const originalTop = index * 30;
      card.style.transform = `translate(${diffX}px,${diffY + originalTop}px)`;
    });
  };

  const dragEnd = (event: React.DragEvent<HTMLDivElement>): void => {
    if (!selectedCards.length) return;
    selectedCards.forEach((card) => {
      card.style.visibility = "hidden";
    });
    const xEndPoint = event.pageX;
    const yEndPoint = event.pageY;
    const dropTarget = document.elementFromPoint(
      xEndPoint,
      yEndPoint,
    ) as HTMLElement;
    selectedCards.forEach((card, index) => {
      card.style.visibility = "visible";
      card.classList.remove(styles.dragging);
      const originalTop = index * 30;
      card.style.transform = `translate(0px,${originalTop}px)`;
    });
    if (!dropTarget) {
      selectedCards = [];
      return;
    }
    const isDraggingSelf = selectedCards.some((card) => card === dropTarget);
    if (isDraggingSelf) {
      selectedCards = [];
      return;
    }
    let targetDeckIndex = -1;
    const targetElement = dropTarget.closest(
      ".card, .cardHolder",
    ) as HTMLElement;
    if (!targetElement) {
      selectedCards = [];
      return;
    }
    if (targetElement.classList.contains("card")) {
      targetDeckIndex = parseInt(
        targetElement.getAttribute("data-deck-index") || "-1",
      );
    } else if (targetElement.classList.contains("cardHolder")) {
      targetDeckIndex = parseInt(targetElement.id);
    } else {
      const cardHolder = targetElement.closest(".cardHolder");
      if (cardHolder) {
        targetDeckIndex = parseInt(cardHolder.id);
      }
    }
    if (targetDeckIndex === -1 || targetDeckIndex > 9) {
      selectedCards = [];
      return;
    }
    const sourceDeckIndex = parseInt(
      selectedCards[0].getAttribute("data-deck-index") || "-1",
    );
    if (sourceDeckIndex === targetDeckIndex || sourceDeckIndex > 9) {
      selectedCards = [];
      return;
    }
    const topMovedRankStr =
      selectedCards[0].getAttribute("data-original-rank") || "0";
    const topMovedCard: CardType = {
      rank: topMovedRankStr,
      isDown: false,
    };
    const targetDeck = game.decks[targetDeckIndex];
    const targetTop =
      targetDeck.length === 0 ? null : targetDeck[targetDeck.length - 1];
    const moveAllowed = isValidMove(topMovedCard, targetTop);
    if (moveAllowed) {
      const tempDecks = game.decks.map((col) => [...col]);
      const selectedCardsStartingIndex = parseInt(
        selectedCards[0].getAttribute("data-index") || "0",
      );
      const selectedCardsCount = selectedCards.length;
      const transferCards = tempDecks[sourceDeckIndex].splice(
        selectedCardsStartingIndex,
        selectedCardsCount,
      );
      tempDecks[targetDeckIndex].push(...transferCards);
      flipNewlyExposedCards(tempDecks);
      let completedDelta = 0;
      for (let guard = 0; guard < 24; guard++) {
        const step = removeCompletedSetsFromTableau(tempDecks);
        if (step === 0) break;
        completedDelta += step;
        flipNewlyExposedCards(tempDecks);
      }
      setGame((prevState) => ({
        ...prevState,
        decks: tempDecks,
        moveCount: prevState.moveCount + 1,
        completed: prevState.completed + completedDelta,
      }));
    }
    selectedCards = [];
  };

  const flipNewlyExposedCards = (decks: CardType[][]): void => {
    for (let i = 0; i < 10; i++) {
      const col = decks[i];
      if (col.length > 0 && col[col.length - 1].isDown) {
        col[col.length - 1] = { ...col[col.length - 1], isDown: false };
      }
    }
  };

  /** Removes completed K→A runs from the first 10 columns; returns how many runs were removed. */
  const removeCompletedSetsFromTableau = (decks: CardType[][]): number => {
    let completedSets = 0;
    for (let i = 0; i < 10; i++) {
      const deck = decks[i];
      let result = checkCompletedSet(deck);
      while (result) {
        deck.splice(result.startIndex, 13);
        completedSets++;
        result = checkCompletedSet(deck);
      }
    }
    return completedSets;
  };

  return (
    <div
      draggable={canDrag}
      data-rank={getRank(data.rank).toString()}
      data-original-rank={data.rank}
      onDragStart={dragStart}
      onDragOver={dragOver}
      onDrag={drag}
      onDragEnd={dragEnd}
      data-deck-index={deckIndex.toString()}
      data-isdown={data.isDown.toString()}
      data-index={index.toString()}
      className={styles.card}
      style={{ top: index * 30 }}
    />
  );
};

export default Card;
