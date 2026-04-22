import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'saralai_document.html');
const pdfPath = path.join(__dirname, 'SaralAI_Complete_Document.pdf');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // Wait for Mermaid diagrams to render
  await page.waitForFunction(() => {
    const svgs = document.querySelectorAll('.mermaid svg');
    return svgs.length > 0;
  }, { timeout: 15000 }).catch(() => console.log('Mermaid timeout - proceeding anyway'));

  await new Promise(r => setTimeout(r, 2000));

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '18mm', bottom: '20mm', left: '18mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:8px;color:#888;width:100%;text-align:center;font-family:Inter,sans-serif;">SaralAI — Complete Project Document · Voice-First Government Services Assistant</div>',
    footerTemplate: '<div style="font-size:8px;color:#888;width:100%;text-align:center;font-family:Inter,sans-serif;">Page <span class="pageNumber"></span> of <span class="totalPages"></span> · March 2026 · Version: MVP Frontend Complete</div>',
  });

  await browser.close();
  console.log('PDF generated at:', pdfPath);
})();
