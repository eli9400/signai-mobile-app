// src/signing/export/exportMultiPagePdf.ts
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { captureRef } from "react-native-view-shot";

type PageData = {
  pageNumber: number;
  imageBase64: string;
  width: number;
  height: number;
  selected: boolean;
};

type Args = {
  pages: PageData[];
  pdfName: string;
  dialogTitle?: string;
};

/**
 * Exports multiple pages as a single PDF using jsPDF
 */
export async function exportMultiPagePdf({
  pages,
  pdfName,
  dialogTitle = "שתף PDF",
}: Args) {
  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error("שיתוף לא זמין במכשיר/סביבה הזו.");
  }

  // Filter only selected pages
  const selectedPages = pages.filter((p) => p.selected);

  if (selectedPages.length === 0) {
    throw new Error("לא נבחרו עמודים לייצוא");
  }

  // Sort by page number
  selectedPages.sort((a, b) => a.pageNumber - b.pageNumber);

  // Convert to PDF using WebView
  const pdfBase64 = await convertPagesToPdf(selectedPages);

  // Save and share
  const cacheDir =
    FileSystem.cacheDirectory || FileSystem.documentDirectory || "";
  const pdfPath = `${cacheDir}${pdfName}`;

  await FileSystem.writeAsStringAsync(pdfPath, pdfBase64, {
    encoding: "base64" as any,
  });

  await Sharing.shareAsync(pdfPath, {
    mimeType: "application/pdf",
    dialogTitle,
    UTI: "com.adobe.pdf",
  });

  return pdfPath;
}

/**
 * Converts multiple pages to a single PDF using jsPDF
 */
function convertPagesToPdf(pages: PageData[]): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create HTML with jsPDF script
    const pagesJson = JSON.stringify(
      pages.map((p) => ({
        imageData: `data:image/png;base64,${p.imageBase64}`,
        width: p.width,
        height: p.height,
        pageNumber: p.pageNumber,
      })),
    );

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>
  <div id="status">Creating multi-page PDF...</div>
  
  <script>
    (function() {
      var pages = ${pagesJson};
      
      function checkJsPDF() {
        if (typeof window.jspdf !== 'undefined') {
          createPdf();
        } else {
          setTimeout(checkJsPDF, 100);
        }
      }
      
      function createPdf() {
        try {
          var jsPDF = window.jspdf.jsPDF;
          var pdf = null;
          
          pages.forEach(function(page, index) {
            var pdfWidth = page.width * 0.264583;
            var pdfHeight = page.height * 0.264583;
            
            if (index === 0) {
              // Create PDF with first page dimensions
              var orientation = pdfWidth > pdfHeight ? 'landscape' : 'portrait';
              pdf = new jsPDF({
                orientation: orientation,
                unit: 'mm',
                format: [pdfWidth, pdfHeight],
                compress: true
              });
            } else {
              // Add new page for subsequent pages
              pdf.addPage([pdfWidth, pdfHeight]);
            }
            
            // Add image to current page
            pdf.addImage(page.imageData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            
            document.getElementById("status").textContent = 
              "Processing page " + (index + 1) + " of " + pages.length + "...";
          });
          
          document.getElementById("status").textContent = "Generating PDF...";
          
          var pdfOutput = pdf.output('datauristring');
          var pdfBase64 = pdfOutput.split(',')[1];
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'pdf-ready',
            data: pdfBase64
          }));
          
        } catch (err) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: err && err.message ? err.message : String(err)
          }));
        }
      }
      
      setTimeout(checkJsPDF, 500);
      
    })();
  </script>
</body>
</html>`;

    // Create temporary HTML file
    const htmlPath = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}multi-pdf-gen.html`;

    FileSystem.writeAsStringAsync(htmlPath, html)
      .then(() => {
        // We need to return the HTML for WebView to load
        resolve(html);
      })
      .catch(reject);
  });
}

/**
 * Returns the HTML content for multi-page PDF conversion
 */
export function getMultiPagePdfHtml(pages: PageData[]): string {
  const pagesJson = JSON.stringify(
    pages.map((p) => ({
      imageData: `data:image/png;base64,${p.imageBase64}`,
      width: p.width,
      height: p.height,
      pageNumber: p.pageNumber,
    })),
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>
  <div id="status">Creating multi-page PDF...</div>
  
  <script>
    (function() {
      var pages = ${pagesJson};
      
      function checkJsPDF() {
        if (typeof window.jspdf !== 'undefined') {
          createPdf();
        } else {
          setTimeout(checkJsPDF, 100);
        }
      }
      
      function createPdf() {
        try {
          var jsPDF = window.jspdf.jsPDF;
          var pdf = null;
          
          pages.forEach(function(page, index) {
            var pdfWidth = page.width * 0.264583;
            var pdfHeight = page.height * 0.264583;
            
            if (index === 0) {
              var orientation = pdfWidth > pdfHeight ? 'landscape' : 'portrait';
              pdf = new jsPDF({
                orientation: orientation,
                unit: 'mm',
                format: [pdfWidth, pdfHeight],
                compress: true
              });
            } else {
              pdf.addPage([pdfWidth, pdfHeight]);
            }
            
            pdf.addImage(page.imageData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            
            document.getElementById("status").textContent = 
              "Processing page " + (index + 1) + " of " + pages.length + "...";
          });
          
          document.getElementById("status").textContent = "Generating PDF...";
          
          var pdfOutput = pdf.output('datauristring');
          var pdfBase64 = pdfOutput.split(',')[1];
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'pdf-ready',
            data: pdfBase64
          }));
          
        } catch (err) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: err && err.message ? err.message : String(err)
          }));
        }
      }
      
      setTimeout(checkJsPDF, 500);
      
    })();
  </script>
</body>
</html>`;
}
