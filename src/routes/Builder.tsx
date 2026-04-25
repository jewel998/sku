import { useEffect, useMemo, useState } from 'react';
import { createLabelPdf, fetchFontBytes, LabelData } from '../lib/pdfGenerator';
import { useDebounce } from '../hooks/useDebounce';
import PageForm from '../components/PageForm';
import PDFViewer from '../components/PDFViewer';
import { uniq } from 'lodash-es';
import { Search, Plus, FileText, Trash2 } from 'lucide-react';
import { useLabelStore } from '../stores/labelStore';
import { useConfig } from '../contexts/ConfigContext';

export default function BuilderPage({ fontLoaded }: { fontLoaded: boolean }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [, /*loading*/ setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { pages, searchQuery, addPage, removePage, updatePage, setSearchQuery, clearAll } =
    useLabelStore();
  const { config, source, isStale, error: configError } = useConfig();

  const brands = useMemo(() => uniq(config.brands), [config.brands]);
  const categories = config.categories;
  const pageCount = pages.length;

  const debouncedPages = useDebounce(pages, 300);

  const filteredPages = useMemo(() => {
    if (!searchQuery) return pages;
    return pages.filter(
      (page) =>
        page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.locationId.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [pages, searchQuery]);

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

  const handleUpdatePage = (index: number, nextPage: LabelData) => {
    if (nextPage.brand && nextPage.category && !nextPage.locationId) {
      const mapped = config.mapping[nextPage.brand]?.[nextPage.category]?.[0] ?? '';
      nextPage = { ...nextPage, locationId: mapped };
    }
    updatePage(index, nextPage);
  };

  const handleAddPage = () => {
    addPage();
  };

  const handleRemovePage = (index: number) => {
    removePage(index);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start p-4 md:p-6 pb-8">
      <section className="bg-slate-900/96 border border-white/10 rounded-xl p-4 md:p-5 shadow-lg w-full lg:flex-1">
        <div className="text-lg md:text-xl font-bold mb-5 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Label Builder
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search labels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-5 mb-4">
          {filteredPages.map((page, index) => (
            <PageForm
              key={index}
              index={index}
              page={page}
              brands={brands}
              categories={categories}
              mapping={config.mapping}
              onChange={handleUpdatePage}
              onRemove={handleRemovePage}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:-translate-y-px shadow-md hover:shadow-lg flex-1 sm:flex-none text-sm md:text-base"
              onClick={handleAddPage}
            >
              <Plus className="w-4 h-4" />
              Add Label
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 hover:-translate-y-px shadow-md hover:shadow-lg flex-1 sm:flex-none text-sm md:text-base"
              onClick={clearAll}
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
          <div className="px-3 py-1 bg-green-900/20 text-green-300 rounded-full text-xs md:text-sm">
            {pageCount} labels
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-400">
          Config source: {source}
          {isStale ? ' (sync pending)' : ''}
        </div>

        {error ? (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-700/30 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        ) : null}
        {configError ? (
          <div className="mt-3 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg text-amber-200 text-sm">
            Firebase config is unavailable, using the latest local backup.
          </div>
        ) : null}
      </section>

      <div className="w-full lg:flex-[1.2] lg:sticky lg:top-24">
        <PDFViewer pdfUrl={pdfUrl} />
      </div>
    </div>
  );
}
