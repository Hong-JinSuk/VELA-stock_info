import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useState } from 'react';

interface UseExportPdfOptions {
  pixelRatio?: number;
}

export function useExportPdf(options: UseExportPdfOptions = { pixelRatio: 2 }) {
  const [isExporting, setIsExporting] = useState(false);

  const exportPdf = async (
    elementId: string,
    filename: string = 'export.pdf',
  ) => {
    const element = document.getElementById(elementId);
    if (!element || isExporting) return;

    setIsExporting(true);

    try {
      // 다크모드 감지 및 배경색 지정
      const isDark = document.documentElement.classList.contains('dark');
      const bgColor = isDark ? '#09090b' : '#ffffff';
      const pdfFillColor = isDark ? [9, 9, 11] : [255, 255, 255];

      // html-to-image로 캡처
      const imgData = await toPng(element, {
        pixelRatio: options.pixelRatio,
        backgroundColor: bgColor,
        filter: (node) => {
          // data-export-ignore 속성이 있는 엘리먼트는 캡처에서 제외
          if (
            node instanceof HTMLElement &&
            node.hasAttribute('data-export-ignore')
          ) {
            return false;
          }
          return true;
        },
      });

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // PDF 비율 및 사이즈 계산 (A4 기준)
      const pdfWidth = 210;
      const pdfHeight = (img.height * pdfWidth) / img.width;

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      });

      // 배경색 칠하기
      pdf.setFillColor(pdfFillColor[0], pdfFillColor[1], pdfFillColor[2]);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

      // 이미지 추가 및 저장
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsExporting(false);
    }
  };

  return { exportPdf, isExporting };
}
