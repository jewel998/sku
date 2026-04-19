import { Info } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-slate-900/96 border border-white/10 rounded-xl p-6 shadow-lg">
        <div className="text-lg font-bold mb-3 flex items-center gap-2">
          <Info className="w-5 h-5" />
          About SKU Label Maker
        </div>
        <p className="text-slate-400 mb-4">
          A mobile-friendly PWA that generates product label PDFs using `pdf-lib` in the browser.
          Each label renders on its own small page, and you can install this app locally on your
          phone.
        </p>
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
          <h2 className="text-white font-semibold mb-2">Features</h2>
          <ul className="text-slate-300 space-y-1">
            <li>Live form-driven label generation</li>
            <li>PDF export with Comfortaa font embedded</li>
            <li>PWA install support for mobile use</li>
            <li>Brand/category/location mapping via config</li>
            <li>GitHub Pages deployment ready</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
