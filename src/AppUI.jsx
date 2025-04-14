// src/AppUI.jsx
import React from "react";
import useGameStore from "./state/gameStore";
import HUD from "./components/UI/HUD";
// import Leaderboard from "./components/UI/Leaderboard"; // Keep for later if needed
import EndOfRaceScreen from "./components/UI/EndOfRaceScreen"; // Import the new screen
import "./components/UI/styles.css";

export default function AppUI() {
  const { raceFinished } = useGameStore((state) => state);

  return (
    <div className="ui-layer">
      {" "}
      {/* Changed class for clarity */}
      {!raceFinished ? <HUD /> : <EndOfRaceScreen />}{" "}
      {/* Show EndOfRaceScreen when finished */}
    </div>
  );
}
