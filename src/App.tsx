import { useEffect, useMemo, useState } from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import BuilderPage from './routes/Builder';
import AboutPage from './routes/About';
import ConfigPage from './routes/Config';
import LoginPage from './routes/Login';
import { fetchFontBytes } from './lib/pdfGenerator';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import './index.css';

function AppShell() {
  const [fontLoaded, setFontLoaded] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    fetchFontBytes()
      .then(() => setFontLoaded(true))
      .catch(() => setFontLoaded(false));
  }, []);

  const routeDefinitions = useMemo(
    () => [
      {
        path: '/',
        component: (
          <ProtectedRoute>
            <ConfigProvider>
              <BuilderPage fontLoaded={fontLoaded} />
            </ConfigProvider>
          </ProtectedRoute>
        ),
        aliases: ['/builder', '/home'],
      },
      {
        path: '/config',
        component: (
          <ProtectedRoute>
            <ConfigProvider>
              <ConfigPage />
            </ConfigProvider>
          </ProtectedRoute>
        ),
        aliases: ['/configuration'],
      },
      { path: '/about', component: <AboutPage />, aliases: ['/info'] },
      { path: '/login', component: <LoginPage />, aliases: [] },
    ],
    [fontLoaded],
  );

  const navLinks = useMemo(
    () => [
      { label: 'Builder', path: '/' },
      { label: 'Config', path: '/config' },
      { label: 'About', path: '/about' },
    ],
    [],
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-200 font-sans">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 md:p-5 bg-slate-900/95 sticky top-0 z-10 border-b border-slate-700/20">
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-bold text-slate-100"
        >
          <img
            src="/sku/logo.svg"
            alt="SKU Label Maker"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl border border-slate-700 bg-slate-950"
          />
          <span className="text-sm sm:text-base">SKU Label Maker</span>
        </Link>
        <nav className="flex gap-2 sm:gap-4 flex-wrap justify-center sm:justify-end">
          {navLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-slate-300 hover:text-white transition-colors text-xs sm:text-sm md:text-base px-2 py-1 rounded hover:bg-slate-700/20"
            >
              {item.label}
            </Link>
          ))}
          {auth.status === 'allowed' ? (
            <button
              type="button"
              onClick={() => void auth.signOut()}
              className="text-slate-300 hover:text-white transition-colors text-xs sm:text-sm md:text-base px-2 py-1 rounded hover:bg-slate-700/20"
            >
              Sign out
            </button>
          ) : null}
        </nav>
      </header>
      <main className="flex-1">
        <Routes>
          {routeDefinitions.flatMap(({ path, component, aliases }) => [
            <Route key={path} path={path} element={component} />,
            ...aliases.map((alias) => <Route key={alias} path={alias} element={component} />),
          ])}
        </Routes>
      </main>
      <footer className="p-3 md:p-4 bg-slate-800 text-center text-slate-400 text-xs sm:text-sm">
        <p>Made for jewel998 / sku • install as PWA for mobile use</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
