import type {IndexedEnrollment} from "./edumfa";

export const matrixRows = [..."ABCDEFGHI"];
export const matrixColumns = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function matrixCoordinate(position: number) {
    const index = position - 1;
    const width = matrixColumns.length;
    return `${matrixRows[Math.floor(index / width)]}${matrixColumns[index % width]}`;
}

export async function createMatrixPdf({serial, secret}: IndexedEnrollment, title: string) {
    const {PDFDocument, PageSizes, StandardFonts, grayscale} = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const page = pdf.addPage(PageSizes.A4);
    const regular = pdf.embedStandardFont(StandardFonts.Helvetica);
    const bold = pdf.embedStandardFont(StandardFonts.HelveticaBold);
    const mono = pdf.embedStandardFont(StandardFonts.CourierBold);
    const gray = grayscale(0.32);
    const border = grayscale(0.75);
    const shadedRow = grayscale(0.95);
    const cellSize = 50;
    const left = (page.getWidth() - matrixColumns.length * cellSize) / 2;
    const top = page.getHeight() - 164;

    pdf.setTitle(title);
    page.drawText(title, {x: left, y: top + 84, size: 26, font: bold});
    page.drawText(serial, {x: left, y: top + 59, size: 11, font: regular, color: gray});
    for (const [columnIndex, column] of matrixColumns.entries()) {
        const label = String(column);
        const center = left + (columnIndex + 0.5) * cellSize;
        page.drawText(label, {x: center - bold.widthOfTextAtSize(label, 12) / 2, y: top + 12, size: 12, font: bold});
    }
    for (const [rowIndex, row] of matrixRows.entries()) {
        const y = top - (rowIndex + 1) * cellSize;
        page.drawText(row, {x: left - 21, y: y + 21, size: 12, font: bold});
        for (const [columnIndex, column] of matrixColumns.entries()) {
            const x = left + columnIndex * cellSize;
            const character = secret[rowIndex * matrixColumns.length + columnIndex];
            page.drawRectangle({
                x,
                y,
                width: cellSize,
                height: cellSize,
                borderColor: border,
                borderWidth: 0.5,
                color: rowIndex % 2 ? shadedRow : undefined,
            });
            page.drawText(`${row}${column}`, {x: x + 5, y: y + 37, size: 8, font: regular, color: gray});
            page.drawText(character, {
                x: x + (cellSize - mono.widthOfTextAtSize(character, 21)) / 2,
                y: y + 14,
                size: 21,
                font: mono,
            });
        }
    }

    return pdf.save();
}
