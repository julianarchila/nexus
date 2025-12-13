import type { AppVersions } from "../../../shared/types";

interface SystemInfoProps {
  versions: AppVersions;
}

function SystemInfo({ versions }: SystemInfoProps) {
  return (
    <section className="content-card">
      <h2>System Info</h2>
      <div className="version-info">
        <div className="version-item">
          <span className="version-label">Node.js</span>
          <span id="node-version" className="version-value">
            {versions.node}
          </span>
        </div>
        <div className="version-item">
          <span className="version-label">Chrome</span>
          <span id="chrome-version" className="version-value">
            {versions.chrome}
          </span>
        </div>
        <div className="version-item">
          <span className="version-label">Electron</span>
          <span id="electron-version" className="version-value">
            {versions.electron}
          </span>
        </div>
      </div>
    </section>
  );
}

export default SystemInfo;
