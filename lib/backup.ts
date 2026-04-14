import { RawSheet, ManagementRecord } from "./store";

export interface ParsedData {
  rawSheets: { [key: string]: RawSheet };
}

export interface BackupMetadata {
  createdAt: string;
  type: "full" | "period";
  startMonth?: string;
  endMonth?: string;
}

export function validateBackupFileName(fileName: string): boolean {
  // Full backup: YYYY-MM-DD-전체관리비내역.xlsx
  // Period backup: YYYY-MM-DD-YYYY-MM-DD-기간관리비내역.xlsx

  const fullBackupRegex = /^\d{4}-\d{2}-\d{2}-전체관리비내역\.xlsx$/;
  const periodBackupRegex = /^\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}-기간관리비내역\.xlsx$/;

  return fullBackupRegex.test(fileName) || periodBackupRegex.test(fileName);
}

export function generateFullBackupFile(rawSheets: { [key: string]: RawSheet }): Blob {
  const XLSX = require("xlsx");

  // Sort months in ascending order
  const sortedMonths = Object.keys(rawSheets).sort();

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Add each month as a sheet
  sortedMonths.forEach((yearMonth) => {
    const sheet = rawSheets[yearMonth];
    const sheetName = yearMonth; // e.g., "2026-01"

    // Prepare data: [연도-월, 항목, 금월, 전월, 증감]
    const data = [
      ["연도-월", "항목", "금월", "전월", "증감"],
      ...sheet.items.map((item) => [
        yearMonth,
        item.item,
        item.amount !== null ? item.amount : "",
        item.prev !== null ? item.prev : "",
        item.diff !== null ? item.diff : "",
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // Generate blob
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function generatePeriodBackupFile(
  rawSheets: { [key: string]: RawSheet },
  startMonth: string,
  endMonth: string
): Blob {
  const XLSX = require("xlsx");

  // Filter months within range
  const sortedMonths = Object.keys(rawSheets)
    .filter((month) => month >= startMonth && month <= endMonth)
    .sort();

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Add each month as a sheet
  sortedMonths.forEach((yearMonth) => {
    const sheet = rawSheets[yearMonth];
    const sheetName = yearMonth;

    const data = [
      ["연도-월", "항목", "금월", "전월", "증감"],
      ...sheet.items.map((item) => [
        yearMonth,
        item.item,
        item.amount !== null ? item.amount : "",
        item.prev !== null ? item.prev : "",
        item.diff !== null ? item.diff : "",
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // Generate blob
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function parseBackupFile(file: File): Promise<ParsedData> {
  const XLSX = require("xlsx");

  // Validate filename
  if (!validateBackupFileName(file.name)) {
    throw new Error(
      "유효하지 않은 백업 파일 형식입니다. 전체 백업 파일만 복구할 수 있습니다."
    );
  }

  // Check if it's a full backup file (not period backup)
  if (file.name.includes("기간")) {
    throw new Error("기간 백업 파일은 복구할 수 없습니다. 전체 백업 파일만 복구 가능합니다.");
  }

  // Read file
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });

  const rawSheets: { [key: string]: RawSheet } = {};

  // Process each sheet (one sheet per month)
  wb.SheetNames.forEach((sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (data.length < 2) {
      throw new Error(`시트 "${sheetName}"에 유효한 데이터가 없습니다.`);
    }

    const headers = data[0] as string[];

    // Validate schema
    const expectedHeaders = ["연도-월", "항목", "금월", "전월", "증감"];
    if (headers.length < expectedHeaders.length) {
      throw new Error(`시트 "${sheetName}"의 열 구조가 올바르지 않습니다.`);
    }

    // Parse items
    const items: ManagementRecord[] = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (row.length === 0 || (row[0] === undefined && row[1] === undefined)) {
        continue; // Skip empty rows
      }

      items.push({
        item: String(row[1] || ""),
        amount: typeof row[2] === "number" ? row[2] : null,
        prev: typeof row[3] === "number" ? row[3] : null,
        diff: typeof row[4] === "number" ? row[4] : null,
      });
    }

    rawSheets[sheetName] = {
      items,
      updatedAt: new Date().getTime(),
    };
  });

  return { rawSheets };
}

export function validateBackupData(data: ParsedData): boolean {
  if (!data || !data.rawSheets) {
    return false;
  }

  // Check if rawSheets is an object with at least one month
  if (Object.keys(data.rawSheets).length === 0) {
    return false;
  }

  // Validate each sheet
  for (const [yearMonth, sheet] of Object.entries(data.rawSheets)) {
    // Validate month format YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
      return false;
    }

    // Check items array exists
    if (!Array.isArray(sheet.items)) {
      return false;
    }

    // Validate each item
    for (const item of sheet.items) {
      if (!item.item || typeof item.item !== "string") {
        return false;
      }
    }
  }

  return true;
}

export function downloadFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function renderHTMLToCanvas(html: string, contentWidth: number): Promise<HTMLCanvasElement> {
  const html2canvas = require("html2canvas");

  // Create iframe for isolated rendering
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  iframe.style.width = `${contentWidth}mm`;
  iframe.style.height = "100px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) throw new Error("Could not access iframe document");

  // Write isolated HTML with no external stylesheets
  const isolatedHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #000000;
            background-color: #ffffff;
            padding: 10mm;
            width: ${contentWidth}mm;
          }
          h1, h3 { font-weight: bold; }
          h1 { font-size: 28px; margin-bottom: 10px; }
          h3 { font-size: 16px; margin-bottom: 10px; }
          p { font-size: 12px; color: #666666; margin: 5px 0; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          thead tr {
            background-color: #f0f0f0;
            border-bottom: 2px solid #333333;
          }
          th {
            padding: 8px;
            text-align: left;
            font-weight: bold;
          }
          th:nth-child(2), th:nth-child(3), th:nth-child(4) {
            text-align: right;
            width: 80px;
          }
          tbody tr {
            border-bottom: 1px solid #e0e0e0;
          }
          td {
            padding: 8px;
            text-align: left;
          }
          td:nth-child(2), td:nth-child(3), td:nth-child(4) {
            text-align: right;
          }
          .content-section {
            margin-bottom: 20px;
          }
          .title-section {
            text-align: center;
            margin-bottom: 30px;
          }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `;

  iframeDoc.open();
  iframeDoc.write(isolatedHTML);
  iframeDoc.close();

  // Wait for content to render
  await new Promise((resolve) => setTimeout(resolve, 100));

  const bodyElement = iframeDoc.body;
  const canvas = await html2canvas(bodyElement, {
    scale: 2,
    useCORS: false,
    logging: false,
    backgroundColor: "#ffffff",
    allowTaint: true,
  });

  document.body.removeChild(iframe);
  return canvas;
}

export async function generateFullPDF(rawSheets: { [key: string]: RawSheet }): Promise<Blob> {
  const jsPDF = require("jspdf").jsPDF;

  const sortedMonths = Object.keys(rawSheets).sort();
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - 20; // 10mm margins
  let isFirstPage = true;

  // Title and date section
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const titleHTML = `
    <div class="title-section">
      <h1>전체 관리비 내역</h1>
      <p>출력일: ${dateStr}</p>
    </div>
  `;

  for (const yearMonth of sortedMonths) {
    const sheet = rawSheets[yearMonth];

    // Create table HTML for current month
    const tableHTML = `
      <div class="content-section">
        <h3>${yearMonth}</h3>
        <table>
          <thead>
            <tr>
              <th>항목</th>
              <th>금월</th>
              <th>전월</th>
              <th>증감</th>
            </tr>
          </thead>
          <tbody>
            ${sheet.items.map((item) => `
              <tr>
                <td>${item.item}</td>
                <td>${item.amount !== null ? item.amount.toLocaleString() : "-"}</td>
                <td>${item.prev !== null ? item.prev.toLocaleString() : "-"}</td>
                <td>${item.diff !== null ? item.diff.toLocaleString() : "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    const fullHTML = (isFirstPage ? titleHTML : "") + tableHTML;
    const canvas = await renderHTMLToCanvas(fullHTML, contentWidth);

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add to PDF
    if (!isFirstPage) {
      doc.addPage();
    }

    // Calculate available space on first page
    let yPosition = 10;
    let availableHeight = pageHeight - 20;

    if (isFirstPage) {
      yPosition = 10 + 30; // Account for title section
      availableHeight -= 30;
    }

    // Add image to PDF
    if (imgHeight <= availableHeight) {
      doc.addImage(imgData, "PNG", 10, yPosition, imgWidth, imgHeight);
    } else {
      // Split across pages if needed
      let remainingHeight = imgHeight;
      let sourceY = 0;

      while (remainingHeight > 0) {
        const heightToDraw = Math.min(remainingHeight, availableHeight);
        const sourceHeight = (heightToDraw * canvas.height) / imgHeight;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = sourceHeight;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
          const tempImgData = tempCanvas.toDataURL("image/png");
          doc.addImage(tempImgData, "PNG", 10, yPosition, imgWidth, heightToDraw);
        }

        remainingHeight -= heightToDraw;
        sourceY += sourceHeight;

        if (remainingHeight > 0) {
          doc.addPage();
          yPosition = 10;
          availableHeight = pageHeight - 20;
        }
      }
    }

    isFirstPage = false;
  }

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("Arial", "normal");
    doc.setFontSize(9);
    doc.text(`${i} / ${totalPages}`, pageWidth / 2, pageHeight - 5, {
      align: "center",
    });
  }

  return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
}

export async function generatePeriodPDF(
  rawSheets: { [key: string]: RawSheet },
  startMonth: string,
  endMonth: string
): Promise<Blob> {
  const jsPDF = require("jspdf").jsPDF;

  const sortedMonths = Object.keys(rawSheets)
    .filter((month) => month >= startMonth && month <= endMonth)
    .sort();

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - 20; // 10mm margins
  let isFirstPage = true;

  // Title and date section
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const titleHTML = `
    <div class="title-section">
      <h1>기간별 관리비 내역</h1>
      <p>출력일: ${dateStr}</p>
      <p>기간: ${startMonth} ~ ${endMonth}</p>
    </div>
  `;

  for (const yearMonth of sortedMonths) {
    const sheet = rawSheets[yearMonth];

    // Create table HTML for current month
    const tableHTML = `
      <div class="content-section">
        <h3>${yearMonth}</h3>
        <table>
          <thead>
            <tr>
              <th>항목</th>
              <th>금월</th>
              <th>전월</th>
              <th>증감</th>
            </tr>
          </thead>
          <tbody>
            ${sheet.items.map((item) => `
              <tr>
                <td>${item.item}</td>
                <td>${item.amount !== null ? item.amount.toLocaleString() : "-"}</td>
                <td>${item.prev !== null ? item.prev.toLocaleString() : "-"}</td>
                <td>${item.diff !== null ? item.diff.toLocaleString() : "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    const fullHTML = (isFirstPage ? titleHTML : "") + tableHTML;
    const canvas = await renderHTMLToCanvas(fullHTML, contentWidth);

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add to PDF
    if (!isFirstPage) {
      doc.addPage();
    }

    // Calculate available space on first page
    let yPosition = 10;
    let availableHeight = pageHeight - 20;

    if (isFirstPage) {
      yPosition = 10 + 35; // Account for title section
      availableHeight -= 35;
    }

    // Add image to PDF
    if (imgHeight <= availableHeight) {
      doc.addImage(imgData, "PNG", 10, yPosition, imgWidth, imgHeight);
    } else {
      // Split across pages if needed
      let remainingHeight = imgHeight;
      let sourceY = 0;

      while (remainingHeight > 0) {
        const heightToDraw = Math.min(remainingHeight, availableHeight);
        const sourceHeight = (heightToDraw * canvas.height) / imgHeight;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = sourceHeight;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
          const tempImgData = tempCanvas.toDataURL("image/png");
          doc.addImage(tempImgData, "PNG", 10, yPosition, imgWidth, heightToDraw);
        }

        remainingHeight -= heightToDraw;
        sourceY += sourceHeight;

        if (remainingHeight > 0) {
          doc.addPage();
          yPosition = 10;
          availableHeight = pageHeight - 20;
        }
      }
    }

    isFirstPage = false;
  }

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("Arial", "normal");
    doc.setFontSize(9);
    doc.text(`${i} / ${totalPages}`, pageWidth / 2, pageHeight - 5, {
      align: "center",
    });
  }

  return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
}
