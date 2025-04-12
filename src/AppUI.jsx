// src/AppUI.jsx
import React from "react";
import useGameStore from "./state/gameStore";
import HUD from "./components/UI/HUD";
import Leaderboard from "./components/UI/Leaderboard";
import "./components/UI/styles.css";

export default function AppUI() {
  const { raceFinished } = useGameStore((state) => state);

  return (
    <div className="hud-container">
      {!raceFinished ? <HUD /> : <Leaderboard />}
    </div>
  );
}
