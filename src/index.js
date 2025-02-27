import React from "react";
import { createRoot } from "react-dom/client";
import BlackjackGame from "./App";
import "./styles.css";

// 获取根元素
const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

// 渲染游戏
root.render(
  <React.StrictMode>
    <div className="app-container">
      <h1 className="game-title">Blackjack Game</h1>
      <BlackjackGame />
    </div>
  </React.StrictMode>
);