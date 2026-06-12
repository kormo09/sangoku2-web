import { useState } from "preact/hooks";
import { AuthGate } from "./AuthGate";
import { Game } from "./Game";
import { Splash } from "./Splash";

export function App() {
  const [started, setStarted] = useState(false);

  return (
    <AuthGate>
      <div class="app">
        {started ? <Game /> : <Splash onStartGame={() => setStarted(true)} />}
        <div class="app__version">v{APP_VERSION}</div>
      </div>
    </AuthGate>
  );
}
