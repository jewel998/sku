import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import * as fontkit from 'fontkit';
import ComfortaaRegularFont from '../fonts/Comfortaa/Comfortaa-Regular.ttf';

type PDFDocumentInstance = Awaited<ReturnType<typeof PDFDocument.create>>;
type PDFLibFontkit = Parameters<PDFDocumentInstance['registerFontkit']>[0];

export async function fetchFontBytes(fontUrl: string = ComfortaaRegularFont): Promise<Uint8Array> {
  const response = await fetch(fontUrl);
  const fontArrayBuffer = await response.arrayBuffer();
  return new Uint8Array(fontArrayBuffer);
}

export interface LabelData {
  name: string;
  size: string;
  brand: string;
  category: string;
  locationId: string;
}

const CM_TO_POINT = 28.3464567;
const PAGE_WIDTH_CM = 5;
const PAGE_HEIGHT_CM = 2;

export async function createLabelPdf(labels: LabelData[], _fontBytes: Uint8Array): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  // Register fontkit for custom font embedding on the PDFDocument instance.
  pdfDoc.registerFontkit(fontkit as unknown as PDFLibFontkit);
  
  // Load custom Comfortaa fonts
  const regularFontBytes = await fetchFontBytes(ComfortaaRegularFont);
  
  const regularFont = await pdfDoc.embedFont(regularFontBytes);
  
  const fontSize = 6;
  const pageWidth = PAGE_WIDTH_CM * CM_TO_POINT;
  const pageHeight = PAGE_HEIGHT_CM * CM_TO_POINT;

  function getTextWidth(font: PDFFont, text: string, size: number): number {
    return font.widthOfTextAtSize(text, size);
  }

  const row2ColFractions = [0.2, 0.55, 0.25];

  labels.forEach((label) => {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const xMargin = 6;
    const yMargin = 4;
    const lineHeight = 8;
    const availableWidth = pageWidth - xMargin * 2;
    
    page.setMediaBox(0, 0, pageWidth, pageHeight);


    /* Row 1 */
    page.drawRectangle({
        x: xMargin,
        y: yMargin + lineHeight * 4,
        width: availableWidth,
        height: lineHeight * 2,
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.5,
    });


    /* Row 2 */
    row2ColFractions.reduce((x, fraction) => {
        page.drawRectangle({
            x,
            y: yMargin + lineHeight * 2,
            width: availableWidth * fraction,
            height: lineHeight * 2,
            borderColor: rgb(0, 0, 0),
            borderWidth: 0.5,
        });
        return x +availableWidth * fraction;
    }, xMargin);

    /* Row 3 */
    page.drawRectangle({
        x: xMargin,
        y: yMargin,
        width: availableWidth,
        height: lineHeight * 2,
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.5,
    });

    const textMargin = 4
    const textX = xMargin + textMargin;

    /* Row 1 */
    const lines = Math.ceil(getTextWidth(regularFont, label.name, fontSize) / (availableWidth - textMargin * 2));
    page.drawText(label.name, {
      x: textX,
      y: pageHeight - yMargin * 2 - (lines > 1 ? fontSize * 0.7 : fontSize),
      maxWidth: availableWidth - textMargin * 2,
      size: fontSize,
      lineHeight: fontSize,
      font: regularFont,
      color: rgb(0, 0, 0),
      wordBreaks: ['']
    });


    /* Row 2 */
    const row2Y = pageHeight - yMargin * 2 - fontSize * 3.75;
    const values = [label.size, label.brand, label.category];
    row2ColFractions.reduce((prevX, fraction, index) => {
        const maxWidth = availableWidth * fraction - textMargin * 2;
        const text = values[index];
        const lines = Math.ceil(getTextWidth(regularFont, text, fontSize) / maxWidth);
        const x = prevX + textMargin;
        const y = row2Y + (lines > 1 ? fontSize * 0.4 : 0);
        page.drawText(text, {
            x: x,
            y: y,
            maxWidth: maxWidth,
            size: fontSize,
            font: regularFont,
            color: rgb(0, 0, 0),
            lineHeight: fontSize,
            wordBreaks: ['']
        });
        return x + maxWidth + textMargin
    }, xMargin);

    /* Row 3 */
    const row3Y = pageHeight - yMargin * 2 - fontSize * 6.5;
    page.drawText(label.locationId, {
      x: textX,
      y: row3Y,
      maxWidth: availableWidth - textMargin * 2,
      size: fontSize,
      font: regularFont,
      color: rgb(0, 0, 0)
    });
  });

  pdfDoc.setTitle('SKU Labels');
  pdfDoc.setAuthor('Dodo\'s Finds');
  pdfDoc.setCreator('jewel998');
  return pdfDoc.save();
}
