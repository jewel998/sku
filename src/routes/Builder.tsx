import { useEffect, useMemo, useState } from 'react';
import { createLabelPdf, fetchFontBytes, LabelData } from '../lib/pdfGenerator';
import { useDebounce } from '../hooks/useDebounce';
import PageForm from '../components/PageForm';
import PDFViewer from '../components/PDFViewer';
import config from '../data/config.json';
import { uniq } from 'lodash-es';

type ConfigMapping = Record<string, Record<string, string[]>>;

const DEFAULT_PAGE: LabelData = {
  name: '',
  size: '',
  brand: '',
  category: '',
  locationId: '',
};

interface BuilderPageProps {
  fontLoaded: boolean;
}

export default function BuilderPage({ fontLoaded }: BuilderPageProps) {
  const [pages, setPages] = useState<LabelData[]>([{ ...DEFAULT_PAGE }]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brands = useMemo(() => uniq(config.brands), []);
  const categories = config.categories;

  const debouncedPages = useDebounce(pages, 300);

  useEffect(() => {
    if (!fontLoaded) {
      return;
    }

    async function generatePdf() {
      setLoading(true);
      setError(null);

      try {
        const fontBytes = await fetchFontBytes();
        const pdfBytes = await createLabelPdf(debouncedPages, fontBytes);
        const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        setPdfUrl(URL.createObjectURL(blob));
      } catch (error) {
        console.error(error);
        setError('Unable to generate PDF. Check your network or try again.');
      } finally {
        setLoading(false);
      }
    }

    generatePdf();
  }, [debouncedPages, fontLoaded]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const updatePage = (index: number, nextPage: LabelData) => {
    setPages((current) => {
      const next = [...current];
      next[index] = { ...nextPage };

      if (nextPage.brand && nextPage.category && !nextPage.locationId) {
        const mapped =
          (config.mapping as ConfigMapping)[nextPage.brand]?.[nextPage.category]?.[0] ?? '';
        next[index] = { ...nextPage, locationId: mapped };
      }

      return next;
    });
  };

  const addPage = () => setPages((current) => [...current, { ...DEFAULT_PAGE }]);
  const removePage = (index: number) =>
    setPages((current) => current.filter((_, idx) => idx !== index));

  return (
    <div className="grid-split">
      <div className="card">
        <div className="section-title">Label Builder</div>
        <p className="section-note">
          Add label pages and update fields. Each page generates a separate PDF page with a 5cm x
          2cm label.
        </p>

        <div className="field-grid">
          {pages.map((page, index) => (
            <PageForm
              key={index}
              index={index}
              page={page}
              brands={brands}
              categories={categories}
              onChange={updatePage}
              onRemove={removePage}
            />
          ))}
        </div>

        <div className="preview-toolbar" style={{ marginTop: '1rem' }}>
          <button type="button" className="button small-button" onClick={addPage}>
            Add label page
          </button>
          <div className="status-pill">{pages.length} page(s)</div>
        </div>

        {error ? <div className="warning-box">{error}</div> : null}
        <div style={{ marginTop: '1rem' }}>
          <p className="label">
            Install this app as a PWA on mobile for fast access and offline PDF preview support.
          </p>
        </div>
      </div>

      <div>
        <PDFViewer pdfUrl={pdfUrl} />
      </div>
    </div>
  );
}
