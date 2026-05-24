// src/App.tsx
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Practice } from "./pages/Practice";
import { Library } from "./pages/Library";
import { Stats } from "./pages/Stats";
import { initVoices } from "./tts/speak";
import { seedBuiltinSentences } from "./db/seed";

initVoices();

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedBuiltinSentences()
      .then(() => setReady(true))
      .catch((err) => {
        console.error("Seed failed:", err);
        setReady(true); // continue even if seed fails
      });
  }, []);

  if (!ready) {
    return (
      <div className="app-loading">
        <h1>WordGap</h1>
        <p>加载题库中...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/library" element={<Library />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
