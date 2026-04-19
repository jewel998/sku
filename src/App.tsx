import { useEffect, useMemo, useState } from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import BuilderPage from './routes/Builder';
import AboutPage from './routes/About';
import { fetchFontBytes } from './lib/pdfGenerator';
import './index.css';

function App() {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    fetchFontBytes().then(() => setFontLoaded(true)).catch(() => setFontLoaded(false));
  }, []);

  const navLinks = useMemo(
    () => [
      { label: 'Builder', path: '/' },
      { label: 'About', path: '/about' }
    ],
    []
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">SKU Label Maker</div>
        <nav className="site-nav">
          {navLinks.map((item) => (
            <Link key={item.path} to={item.path} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<BuilderPage fontLoaded={fontLoaded} />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      <footer className="footer-bar">
        <p>Made for jewel998 / sku • install as PWA for mobile use</p>
      </footer>
    </div>
  );
}

export default App;
