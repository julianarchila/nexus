import { useEffect, useState } from "react";

import AudioCapture from "./components/AudioCapture";
import SystemInfo from "./components/SystemInfo";
import TitleBar from "./components/TitleBar";

function App() {
  const [versions, setVersions] = useState({
    node: "",
    chrome: "",
    electron: "",
  });

  useEffect(() => {
    window.api.app.getVersions().then(setVersions);
  }, []);

  return (
    <div className="window-container">
      <TitleBar title="Nexus Copilot" />

      <main className="main-content">
        <AudioCapture />
        <SystemInfo versions={versions} />
      </main>
    </div>
  );
}

export default App;
