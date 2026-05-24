// This is a simple script to validate our functions work correctly

// First, let's copy the functions we need
const getRank = (rank) => {
  if (rank === "K" || rank === "Q" || rank === "J" || rank === "A") {
    switch (rank) {
      case "K":
        return 13;
      case "Q":
        return 12;
      case "J":
        return 11;
      case "A":
        return 1;
      default:
        return 0;
    }
  } else {
    return parseInt(rank);
  }
};

const isValidDescendingRun = (deck, start) => {
  if (start < 0 || start >= deck.length) return false;
  if (deck[start].isDown) return false;
  for (let i = start; i < deck.length - 1; i++) {
    if (deck[i + 1].isDown) return false;
    if (getRank(deck[i].rank) !== getRank(deck[i + 1].rank) + 1) return false;
  }
  return true;
};

const findTopmostValidRunStart = (deck) => {
  let firstFaceUp = -1;
  for (let i = 0; i < deck.length; i++) {
    if (!deck[i].isDown) {
      firstFaceUp = i;
      break;
    }
  }
  if (firstFaceUp === -1) return -1;
  
  for (let i = deck.length - 1; i >= 0; i--) {
    if (isValidDescendingRun(deck, i)) {
      if (i === 0 || deck[i - 1].isDown || !isValidDescendingRun(deck, i - 1)) {
        return i;
      }
    }
  }
  
  return -1;
};

const isTopmostValidRunStart = (deck, index) => {
  const topmostStart = findTopmostValidRunStart(deck);
  return topmostStart === index;
};

// Test cases
console.log("Test 1: Single card [7(up)]");
const test1 = [{ rank: "7", isDown: false }];
console.log("findTopmostValidRunStart:", findTopmostValidRunStart(test1));
console.log("isTopmostValidRunStart(0):", isTopmostValidRunStart(test1, 0));
console.log();

console.log("Test 2: K-Q-J all up");
const test2 = [
  { rank: "K", isDown: false },
  { rank: "Q", isDown: false },
  { rank: "J", isDown: false },
];
console.log("findTopmostValidRunStart:", findTopmostValidRunStart(test2));
console.log("isTopmostValidRunStart(0):", isTopmostValidRunStart(test2, 0));
console.log("isTopmostValidRunStart(1):", isTopmostValidRunStart(test2, 1));
console.log("isTopmostValidRunStart(2):", isTopmostValidRunStart(test2, 2));
console.log();

console.log("Test 3: 5,7,6,5 all up");
const test3 = [
  { rank: "5", isDown: false },
  { rank: "7", isDown: false },
  { rank: "6", isDown: false },
  { rank: "5", isDown: false },
];
console.log("findTopmostValidRunStart:", findTopmostValidRunStart(test3));
console.log("isTopmostValidRunStart(0):", isTopmostValidRunStart(test3, 0));
console.log("isTopmostValidRunStart(1):", isTopmostValidRunStart(test3, 1));
console.log("isTopmostValidRunStart(2):", isTopmostValidRunStart(test3, 2));
console.log("isTopmostValidRunStart(3):", isTopmostValidRunStart(test3, 3));
console.log();

console.log("Test 4: K(down), Q(up), J(up)");
const test4 = [
  { rank: "K", isDown: true },
  { rank: "Q", isDown: false },
  { rank: "J", isDown: false },
];
console.log("findTopmostValidRunStart:", findTopmostValidRunStart(test4));
console.log("isTopmostValidRunStart(1):", isTopmostValidRunStart(test4, 1));
console.log();

console.log("Test 5: K(up), Q(up), 10(up), 9(up)");
const test5 = [
  { rank: "K", isDown: false },
  { rank: "Q", isDown: false },
  { rank: "10", isDown: false },
  { rank: "9", isDown: false },
];
console.log("findTopmostValidRunStart:", findTopmostValidRunStart(test5));
console.log("isTopmostValidRunStart(0):", isTopmostValidRunStart(test5, 0));
console.log("isTopmostValidRunStart(2):", isTopmostValidRunStart(test5, 2));
