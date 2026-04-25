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
            height="auto"
            className="border border-slate-600 rounded-lg min-h-64 md:min-h-96 lg:min-h-[800px] aspect-video lg:aspect-auto"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 md:h-64 lg:h-96 bg-slate-800 border border-slate-600 rounded-lg text-slate-400 px-4 text-center text-sm md:text-base">
          <p>Enter label details to see PDF preview</p>
        </div>
      )}
    </>
  );
}
