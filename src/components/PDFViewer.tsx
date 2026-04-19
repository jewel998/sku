import { useMemo } from 'react';

interface PDFViewerProps {
  pdfUrl: string | null;
}

export default function PDFViewer({ pdfUrl }: PDFViewerProps) {
  const iframeSrc = useMemo(() => pdfUrl || '', [pdfUrl]);

  return (
    <>
      {iframeSrc ? (
        <div className="preview-frame">
          <iframe
            title="PDF preview"
            src={iframeSrc}
            width="100%"
            height="420"
            style={{ border: 'none' }}
          />
        </div>
      ) : (
        <div className="illustration-box">
          <p>Fill the label fields and the preview will render automatically.</p>
        </div>
      )}
    </>
  );
}
