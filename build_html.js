import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mdPath = 'C:/Users/siddh/.gemini/antigravity/brain/d4821978-c508-4f4d-83d0-5216ffad0dca/SaralAI_Complete_Document.md.resolved';
const md = fs.readFileSync(mdPath, 'utf8');

// Basic markdown → HTML converter
function mdToHtml(text) {
  const lines = text.split('\n');
  let html = '';
  let inCode = false;
  let codeLang = '';
  let codeBuffer = '';
  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeLang = line.slice(3).trim();
        codeBuffer = '';
        continue;
      } else {
        inCode = false;
        if (codeLang === 'mermaid') {
          html += `<div class="mermaid">${escHtml(codeBuffer.trim())}</div>\n`;
        } else {
          const langClass = codeLang ? ` class="lang-${codeLang}"` : '';
          html += `<pre><code${langClass}>${escHtml(codeBuffer)}</code></pre>\n`;
        }
        codeBuffer = '';
        codeLang = '';
        continue;
      }
    }

    if (inCode) { codeBuffer += line + '\n'; continue; }

    // Tables
    if (line.startsWith('|')) {
      tableRows.push(line);
      inTable = true;
      continue;
    } else if (inTable) {
      html += renderTable(tableRows);
      tableRows = [];
      inTable = false;
    }

    // Headings
    if (/^#{1,6} /.test(line)) {
      const level = line.match(/^(#+)/)[1].length;
      const text = line.slice(level + 1);
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      html += `<h${level} id="${id}">${inlineHtml(text)}</h${level}>\n`;
      continue;
    }

    // HR
    if (/^---+$/.test(line.trim())) { html += '<hr>\n'; continue; }

    // Blockquote
    if (line.startsWith('> ')) {
      html += `<blockquote>${inlineHtml(line.slice(2))}</blockquote>\n`;
      continue;
    }

    // Bullet lists
    if (/^(\s*)[*\-] (.+)/.test(line)) {
      const m = line.match(/^(\s*)[*\-] (.+)/);
      const indent = m[1].length;
      const content = inlineHtml(m[2]);
      html += `<ul style="margin-left:${indent * 8}px"><li>${content}</li></ul>\n`;
      continue;
    }

    // Numbered lists
    if (/^\d+\. (.+)/.test(line)) {
      const content = inlineHtml(line.replace(/^\d+\. /, ''));
      html += `<ol><li>${content}</li></ol>\n`;
      continue;
    }

    // Blank line → paragraph break
    if (line.trim() === '') { html += '<div class="spacer"></div>\n'; continue; }

    html += `<p>${inlineHtml(line)}</p>\n`;
  }

  if (inTable && tableRows.length) html += renderTable(tableRows);
  return html;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineHtml(text) {
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links [text](url) - strip file:// links to just text
  text = text.replace(/\[([^\]]+)\]\(file:\/\/[^\)]+\)/g, '<span class="fileref">$1</span>');
  text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');
  return text;
}

function renderTable(rows) {
  const filtered = rows.filter(r => !/^\|[-| :]+\|$/.test(r.trim()));
  if (!filtered.length) return '';
  let tableHtml = '<table>\n';
  filtered.forEach((row, idx) => {
    const cells = row.split('|').filter((_, i, a) => i > 0 && i < a.length - 1);
    const tag = idx === 0 ? 'th' : 'td';
    tableHtml += '<tr>' + cells.map(c => `<${tag}>${inlineHtml(c.trim())}</${tag}>`).join('') + '</tr>\n';
  });
  tableHtml += '</table>\n';
  return tableHtml;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --blue: #2563EB; --blue-dark: #1D4ED8; --blue-bg: #EFF6FF;
  --green: #10B981; --red: #EF4444; --orange: #F59E0B;
  --text: #1A1A2E; --text2: #475569; --text3: #94A3B8;
  --border: #E2E8F0; --bg: #F8FAFC; --white: #FFFFFF;
  --radius: 10px; --shadow: 0 2px 8px rgba(0,0,0,0.08);
}
body { font-family: 'Inter', sans-serif; font-size: 10.5pt; color: var(--text); background: var(--white); line-height: 1.65; }
.cover { page-break-after: always; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%); color: white; text-align: center; padding: 60px 40px; }
.cover-logo { width: 90px; height: 90px; background: rgba(255,255,255,0.15); border-radius: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 32px; font-size: 40px; }
.cover h1 { font-size: 38pt; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; }
.cover .subtitle { font-size: 14pt; opacity: 0.85; margin-bottom: 32px; font-weight: 400; }
.cover .meta { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius); padding: 20px 40px; display: inline-block; font-size: 10pt; line-height: 2; }
.cover .meta strong { font-weight: 600; }
.toc-page { page-break-after: always; padding: 48px; }
.toc-page h2 { font-size: 22pt; color: var(--blue); margin-bottom: 28px; font-weight: 700; border-bottom: 3px solid var(--blue); padding-bottom: 10px; }
.toc-entry { display: flex; align-items: baseline; padding: 7px 0; border-bottom: 1px dashed var(--border); }
.toc-entry .toc-num { color: var(--blue); font-weight: 700; font-size: 10pt; width: 30px; flex-shrink: 0; }
.toc-entry .toc-title { color: var(--text); font-size: 10pt; }
.toc-entry.sub { padding-left: 30px; }
.toc-entry.sub .toc-title { color: var(--text2); font-size: 9.5pt; }
.content { padding: 0 48px; }
h1 { font-size: 20pt; font-weight: 800; color: var(--text); margin: 32px 0 12px; line-height: 1.2; }
h2 { font-size: 16pt; font-weight: 700; color: var(--blue); margin: 36px 0 14px; padding-bottom: 8px; border-bottom: 2px solid var(--blue-bg); }
h3 { font-size: 13pt; font-weight: 700; color: var(--text); margin: 24px 0 10px; }
h4 { font-size: 11pt; font-weight: 600; color: var(--text2); margin: 18px 0 8px; }
p { margin: 8px 0; color: var(--text); }
hr { border: none; border-top: 2px solid var(--border); margin: 32px 0; }
blockquote { border-left: 4px solid var(--blue); background: var(--blue-bg); padding: 12px 18px; border-radius: 0 var(--radius) var(--radius) 0; margin: 14px 0; color: var(--text2); font-style: italic; }
a { color: var(--blue); text-decoration: none; }
code { font-family: 'JetBrains Mono', monospace; background: #F1F5F9; padding: 2px 6px; border-radius: 4px; font-size: 8.5pt; color: #be185d; }
pre { background: #0F172A; border-radius: var(--radius); padding: 18px 20px; margin: 14px 0; overflow: hidden; page-break-inside: avoid; border: 1px solid #1e293b; }
pre code { background: none; padding: 0; color: #e2e8f0; font-size: 8pt; line-height: 1.7; display: block; white-space: pre-wrap; word-break: break-all; }
pre code.lang-json { color: #86efac; }
pre code.lang-sql { color: #fde68a; }
pre code.lang-css { color: #c4b5fd; }
pre code.lang-html { color: #fdba74; }
pre code.lang-js, pre code.lang-javascript { color: #93c5fd; }
.mermaid { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 24px; margin: 20px 0; text-align: center; box-shadow: var(--shadow); page-break-inside: avoid; }
table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 9.5pt; page-break-inside: avoid; }
th { background: var(--blue); color: white; padding: 10px 14px; text-align: left; font-weight: 600; font-size: 9pt; }
td { padding: 9px 14px; border-bottom: 1px solid var(--border); vertical-align: top; }
tr:hover td { background: var(--blue-bg); }
tr:nth-child(even) td { background: #F8FAFC; }
ul, ol { padding-left: 20px; margin: 6px 0; }
li { margin: 4px 0; color: var(--text); }
.fileref { color: var(--blue); font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; background: var(--blue-bg); padding: 1px 5px; border-radius: 3px; }
.spacer { height: 6px; }
.section-divider { page-break-before: always; }
@media print {
  h2 { page-break-before: auto; }
  .section-divider { page-break-before: always; }
}
`;

const bodyHtml = mdToHtml(md);

const coverPage = `
<div class="cover">
  <div class="cover-logo">🏛️</div>
  <h1>SaralAI</h1>
  <div class="subtitle">सरल AI · Voice-First Government Services Assistant<br>Complete Technical & Architecture Reference</div>
  <div class="meta">
    <strong>Type:</strong> Project Documentation · Full Stack Reference<br>
    <strong>Version:</strong> MVP Frontend Complete<br>
    <strong>Updated:</strong> March 2026<br>
    <strong>Stack:</strong> Vite + Vanilla JS · Node.js / FastAPI (planned)<br>
    <strong>Status:</strong> Frontend ✅ Complete · Backend ❌ Planned
  </div>
</div>`;

const tocPage = `
<div class="toc-page">
  <h2>Table of Contents</h2>
  <div class="toc-entry"><span class="toc-num">1.</span><span class="toc-title">Project Identity</span></div>
  <div class="toc-entry"><span class="toc-num">2.</span><span class="toc-title">What Is Done vs Remaining</span></div>
  <div class="toc-entry"><span class="toc-num">3.</span><span class="toc-title">System Architecture</span></div>
  <div class="toc-entry sub"><span class="toc-num">3.1</span><span class="toc-title">High-Level Flow</span></div>
  <div class="toc-entry sub"><span class="toc-num">3.2</span><span class="toc-title">Data Flow (Client-Side)</span></div>
  <div class="toc-entry sub"><span class="toc-num">3.3</span><span class="toc-title">Navigation Flow Diagram</span></div>
  <div class="toc-entry"><span class="toc-num">4.</span><span class="toc-title">Frontend — Full Breakdown</span></div>
  <div class="toc-entry sub"><span class="toc-num">4.1</span><span class="toc-title">Project Setup</span></div>
  <div class="toc-entry sub"><span class="toc-num">4.2</span><span class="toc-title">Design System &amp; CSS</span></div>
  <div class="toc-entry sub"><span class="toc-num">4.3</span><span class="toc-title">Routing</span></div>
  <div class="toc-entry sub"><span class="toc-num">4.4</span><span class="toc-title">State Management</span></div>
  <div class="toc-entry sub"><span class="toc-num">4.5</span><span class="toc-title">AI Query Engine</span></div>
  <div class="toc-entry sub"><span class="toc-num">4.6</span><span class="toc-title">Icons Library</span></div>
  <div class="toc-entry sub"><span class="toc-num">4.7</span><span class="toc-title">Components (8 Files)</span></div>
  <div class="toc-entry sub"><span class="toc-num">4.8</span><span class="toc-title">Screens (12 Files)</span></div>
  <div class="toc-entry"><span class="toc-num">5.</span><span class="toc-title">Backend — Full Plan</span></div>
  <div class="toc-entry sub"><span class="toc-num">5.1–5.5</span><span class="toc-title">Stack · APIs · Services · AI · Data Models</span></div>
  <div class="toc-entry"><span class="toc-num">6.</span><span class="toc-title">Data Layer — Schemes.json</span></div>
  <div class="toc-entry"><span class="toc-num">7.</span><span class="toc-title">Complete User Flow</span></div>
  <div class="toc-entry"><span class="toc-num">8.</span><span class="toc-title">Verification Status</span></div>
</div>`;

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SaralAI — Complete Project Document</title>
<style>${CSS}</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>mermaid.initialize({ startOnLoad: true, theme: 'default', themeVariables: { primaryColor: '#2563EB', primaryTextColor: '#1A1A2E', primaryBorderColor: '#93C5FD', lineColor: '#475569', secondaryColor: '#EFF6FF', tertiaryColor: '#F8FAFC' } });</script>
</head>
<body>
${coverPage}
${tocPage}
<div class="content">
${bodyHtml}
</div>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'saralai_document.html'), fullHtml, 'utf8');
console.log('HTML written to saralai_document.html');
