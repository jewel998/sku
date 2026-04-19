import { useMemo } from 'react';

interface PDFViewerProps {
  pdfUrl: string | null;
}

export default function PDFViewer({ pdfUrl }: PDFViewerProps) {
  const iframeSrc = useMemo(() => pdfUrl || '', [pdfUrl]);

  return (
    <>
      {iframeSrc ? (
        <div className="w-full">
          <iframe
            title="PDF preview"
            src={`${iframeSrc}#zoom=140`}
            width="100%"
            height="800"
            className="border border-slate-600 rounded-lg"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 bg-slate-800 border border-slate-600 rounded-lg text-slate-400">
          <p>Enter label details to see PDF preview</p>
        </div>
      )}
    </>
  );
}
