import { useState } from "react";
import { useNavigate } from "react-router-dom";

import reactLogo from "@src/shared/icon/react.svg";

import viteLogo from "/vite.svg";
import "./App.css";

function HomePage() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React, About Page</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
        <button onClick={() => navigate("/")}>go to Home Page</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
    </>
  );
}

export default HomePage;
