import React, { Component, type ErrorInfo, useState } from 'react';
import WorkspaceShell from './components/Workspace/WorkspaceShell';
import { ChatStandaloneRoot } from './components/ChatWindow/ChatStandaloneRoot';
import { WindowResizeHandles } from './components/Titlebar/WindowResizeHandles';
import { SplashScreen } from './components/Splash/SplashScreen';
import './App.css';

class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'red', color: 'white' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [chatId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('chatId');
  });

  const [showSplash, setShowSplash] = useState(true);

  React.useEffect(() => {
    if (!chatId) {
      import('./utils/isTauri').then(({ checkIsTauri }) => {
        if (checkIsTauri()) {
          import('@tauri-apps/api/window').then(async ({ getCurrentWindow }) => {
            const win = getCurrentWindow();
            // Window is already centered and shown by the Rust setup builder
            await win.show();
          });
        }
      });
    }
  }, [chatId]);

  if (chatId) {
    return <ChatStandaloneRoot chatId={chatId} />;
  }

  return (
    <ErrorBoundary>
      <WindowResizeHandles />
      <WorkspaceShell />
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
    </ErrorBoundary>
  );
}

export default App;
