import { useEffect, useMemo, useState } from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import BuilderPage from './routes/Builder';
import AboutPage from './routes/About';
import { fetchFontBytes } from './lib/pdfGenerator';
import './index.css';
import { Tag } from 'lucide-react';

function App() {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    fetchFontBytes()
      .then(() => setFontLoaded(true))
      .catch(() => setFontLoaded(false));
  }, []);

  const routeDefinitions = useMemo(
    () => [
      {
        path: '/',
        component: <BuilderPage fontLoaded={fontLoaded} />,
        aliases: ['/builder', '/home'],
      },
      { path: '/about', component: <AboutPage />, aliases: ['/info'] },
    ],
    [fontLoaded],
  );

  const navLinks = useMemo(
    () => [
      { label: 'Builder', path: '/' },
      { label: 'About', path: '/about' },
    ],
    [],
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-200 font-sans">
      <header className="flex items-center justify-between gap-4 p-5 bg-slate-900/95 sticky top-0 z-10 border-b border-slate-700/20">
        <div className="flex items-center gap-2 text-xl font-bold">
          <Tag className="w-6 h-6" />
          SKU Label Maker
        </div>
        <nav className="flex gap-4">
          {navLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-slate-300 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
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
      <footer className="p-4 bg-slate-800 text-center text-slate-400 text-sm">
        <p>Made for jewel998 / sku • install as PWA for mobile use</p>
      </footer>
    </div>
  );
}

export default App;
