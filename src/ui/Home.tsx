import React from "react";
import { Link } from "react-router-dom";
import HomePageLayout from "./HomePageLayout";
import styles from "../styles/Home.module.css";

const Home: React.FC = () => {
  return (
    <HomePageLayout>
      <div className={styles.homeContent}>
        <h1 className={styles.title}>Spider Solitaire</h1>
        <p className={styles.subtitle}>Free Online Card Game</p>
        <Link to="/game" className={styles.startButton}>
          Start Game
        </Link>
        <div className={styles.rules}>
          <h2>How to Play</h2>
          <ul>
            <li>
              Build descending runs in each column (King high down to Ace).
            </li>
            <li>
              You may move a face-up stack only if it forms a valid descending
              sequence.
            </li>
            <li>
              Any valid face-up stack (single card or descending run) may move
              to an empty column.
            </li>
            <li>Complete eight full King-to-Ace runs to win.</li>
            <li>
              You can deal from the stock anytime it has cards (one card goes to
              each column).
            </li>
            <li>
              Use Hint for a suggestion, Undo to step back, and pause the timer
              anytime.
            </li>
          </ul>
        </div>
      </div>
    </HomePageLayout>
  );
};

export default Home;
