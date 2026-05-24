import { CardIdentifier } from "./game";

export let highlightTimeout: number | null = null;

export const clearHighlight = (): void => {
  if (highlightTimeout) {
    window.clearTimeout(highlightTimeout);
    highlightTimeout = null;
  }
  document.querySelectorAll('.highlight-movable').forEach(el => {
    el.classList.remove('highlight-movable');
  });
};

export const applyHighlight = (cards: CardIdentifier[]): void => {
  clearHighlight();
  cards.forEach(({ deckIndex, cardIndex }) => {
    const el = document.querySelector(`[data-deck-index="${deckIndex}"][data-index="${cardIndex}"]`);
    if (el) {
      el.classList.add('highlight-movable');
    }
  });
  
  highlightTimeout = window.setTimeout(() => {
    clearHighlight();
  }, 3000);
};