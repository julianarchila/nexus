interface TitleBarProps {
  title: string;
}

function TitleBar({ title }: TitleBarProps) {
  return (
    <header className="header">
      <div className="header-title">{title}</div>
      <div className="header-actions">
        <button
          type="button"
          className="header-btn btn-minimize"
          onClick={() => window.api.window.minimize()}
          title="Minimize"
        />
        <button
          type="button"
          className="header-btn btn-close"
          onClick={() => window.api.window.close()}
          title="Close"
        />
      </div>
    </header>
  );
}

export default TitleBar;
