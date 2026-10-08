// tools/pdf/build.mjs — Markdown(题目详解) -> 自包含 HTML -> (Chrome 打印) PDF
// 用法示例:
//   node build.mjs --order plan_order.txt --print
//   node build.mjs --order plan_order.txt --cpp-only --out cpp.html --pdf cpp.pdf --print
// 选项:
//   --in <dir>        题目详解目录 (默认 02-Wiki/题目详解)
//   --files a.md,b.md 显式文件列表(调试用, 覆盖 --order)
//   --order <file>    顺序表: 每行一个题号(数字前缀), 以 # 开头的行作为分组标题(如 Day)
//   --out <html>      输出 HTML 路径
//   --pdf <pdf>       输出 PDF 路径
//   --no-toc          不生成封面/目录
//   --cpp-only        丢弃所有 ```python 代码块(仅保留 C++), 省纸
//   --print           生成 HTML 后调用本机 Chrome/Edge 打印成 PDF
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { marked } from 'marked';
import hljs from 'highlight.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const argv = process.argv.slice(2);
const getArg = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : null; };
const has = (n) => argv.includes(`--${n}`);

const inDir = getArg('in') || path.join(ROOT, '02-Wiki', '题目详解');
const filesArg = getArg('files');
const orderFile = getArg('order');
const cppOnly = has('cpp-only') || has('no-python');
const withToc = !has('no-toc');
const suffix = cppOnly ? '-仅Cpp' : '';
const outHtml = path.resolve(getArg('out') || path.join(ROOT, '04-Outputs', `LeetCode-Hot100-题目详解${suffix}.html`));
const outPdf = path.resolve(getArg('pdf') || outHtml.replace(/\.html$/, '.pdf'));

// ---- helpers ----
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function sanitizeWiki(md) {
  return md.replace(/\[\[([^\]]+)\]\]/g, (_, inner) => {
    const parts = inner.split('|');
    const target = parts[0].trim();
    const alias = parts.length > 1 ? parts.slice(1).join('|').trim() : null;
    if (alias) return alias;
    return (target.split('/').pop() || target).trim();
  });
}
function langOf(info) {
  if (!info) return null;
  const l = info.trim().split(/\s+/)[0].toLowerCase();
  const map = { py: 'python', python3: 'python', c: 'cpp', 'c++': 'cpp', javascript: 'javascript', js: 'javascript', java: 'java', go: 'go' };
  return map[l] || l || null;
}

// ---- marked: highlighted fenced code (drop python when --cpp-only) ----
marked.use({
  renderer: {
    code(token) {
      const text = token.text ?? '';
      const lang = langOf(token.lang);
      if (cppOnly && lang === 'python') return '';
      if (lang && hljs.getLanguage(lang)) {
        const body = hljs.highlight(text, { language: lang, ignoreIllegals: true }).value;
        return `<pre><code class="hljs language-${lang}">${body}</code></pre>`;
      }
      return `<pre><code>${esc(text)}</code></pre>`;
    },
  },
});
const render = (md) => marked.parse(sanitizeWiki(md));

// ---- gather + order files ----
const dirFiles = fs.readdirSync(inDir).filter((n) => n.endsWith('.md'));
const idToFile = new Map();
for (const n of dirFiles) {
  const m = n.match(/^(\d+)/);
  if (m && !idToFile.has(m[1])) idToFile.set(m[1], n);
}
let picked = []; // {name, path, group}
if (filesArg) {
  picked = filesArg.split(',').map((f) => f.trim()).map((f) => ({ name: path.basename(f), path: path.isAbsolute(f) ? f : path.join(inDir, f), group: null }));
} else if (orderFile) {
  const lines = fs.readFileSync(path.resolve(orderFile), 'utf8').split(/\r?\n/);
  let group = null;
  const used = new Set();
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) { group = line.replace(/^#+\s*/, ''); continue; }
    const id = line;
    const file = idToFile.get(id);
    if (!file) { console.warn(`[order] 找不到题号 ${id} 对应的 md 文件，已跳过`); continue; }
    picked.push({ name: file, path: path.join(inDir, file), group });
    used.add(file);
  }
  // append any files not listed in the order (numeric sorted), flagged
  const leftover = dirFiles.filter((n) => !used.has(n)).sort((a, b) => (parseInt(a) || 1e9) - (parseInt(b) || 1e9));
  if (leftover.length) {
    console.warn(`[order] 顺序表未覆盖 ${leftover.length} 个文件，追加到末尾: ${leftover.join(', ')}`);
    for (const n of leftover) picked.push({ name: n, path: path.join(inDir, n), group: '（未编入计划）' });
  }
} else {
  picked = dirFiles.map((n) => ({ name: n, path: path.join(inDir, n), group: null }))
    .sort((a, b) => (parseInt(a.name) || 1e9) - (parseInt(b.name) || 1e9) || a.name.localeCompare(b.name));
}

// ---- read + titles ----
const docs = picked.map((p) => {
  const raw = fs.readFileSync(p.path, 'utf8');
  const firstLine = raw.split('\n').find((l) => l.startsWith('# ')) || `# ${p.name}`;
  return { ...p, raw, title: firstLine.replace(/^#\s*/, '').trim() };
});

// ---- styles ----
const hljsCss = fs.readFileSync(path.join(__dirname, 'node_modules', 'highlight.js', 'styles', 'github.css'), 'utf8');
const printCss = `
@page { size: A4; margin: 18mm 15mm 18mm 15mm; }
html, body { margin: 0; padding: 0; }
body { font-family: "Microsoft YaHei","PingFang SC","Noto Sans CJK SC","Source Han Sans SC",sans-serif; font-size: 10.5pt; line-height: 1.62; color: #14171c; }
h1 { font-size: 15.5pt; color: #0b2a5b; border-bottom: 2.5px solid #2563eb; padding-bottom: 6px; margin: 0 0 10px; }
h2 { font-size: 12.5pt; color: #1e3a8a; margin: 15px 0 6px; border-left: 4px solid #2563eb; padding-left: 8px; }
h3 { font-size: 11pt; color: #0f5f57; margin: 11px 0 4px; }
h4 { font-size: 10.5pt; margin: 9px 0 3px; }
p { margin: 5px 0; }
pre { white-space: pre-wrap; word-break: break-word; background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px; padding: 9px 11px; font-family: "Cascadia Mono","Consolas","DejaVu Sans Mono","Sarasa Mono SC",monospace; font-size: 8.8pt; line-height: 1.42; margin: 7px 0; break-inside: avoid; page-break-inside: avoid; }
pre code.hljs { background: transparent; padding: 0; display: block; }
:not(pre) > code { background: #eef2ff; color: #3730a3; padding: 1px 5px; border-radius: 4px; font-family: "Consolas","DejaVu Sans Mono",monospace; font-size: 9.2pt; }
blockquote { border-left: 3px solid #cbd5e1; margin: 6px 0; padding: 2px 12px; color: #475569; background: #f8fafc; }
table { border-collapse: collapse; width: 100%; margin: 8px 0; break-inside: avoid; }
th, td { border: 1px solid #cbd5e1; padding: 4px 8px; font-size: 9.3pt; text-align: left; }
th { background: #eff6ff; }
hr { border: none; border-top: 1px dashed #cbd5e1; margin: 12px 0; }
ul, ol { margin: 5px 0 5px 20px; padding-left: 8px; }
li { margin: 2px 0; }
a { color: #2563eb; text-decoration: none; }
strong { color: #0b1220; }
.problem { break-before: page; page-break-before: always; }
.problem.first { break-before: auto; page-break-before: auto; }
.cover { text-align: center; padding-top: 38vh; break-after: page; page-break-after: always; }
.cover .t1 { font-size: 30pt; color: #0b2a5b; font-weight: 800; letter-spacing: 2px; }
.cover .t2 { font-size: 13pt; color: #2563eb; margin-top: 10px; }
.cover .t3 { font-size: 11pt; color: #475569; margin-top: 6px; }
.cover .meta { font-size: 10.5pt; color: #64748b; margin-top: 60px; }
.toc { break-after: page; page-break-after: always; }
.toc h1 { border: none; }
.toc .grp { font-size: 10.5pt; font-weight: 700; color: #1e3a8a; margin: 8px 0 2px; }
.toc ol { margin: 0 0 2px 20px; font-size: 9.4pt; }
.toc li { margin: 1px 0; }
`;

// ---- assemble ----
const date = new Date().toISOString().slice(0, 10);
const contentLabel = cppOnly ? '仅 C++ 版' : 'Python + C++ 版';
let body = '';
if (withToc) {
  body += `<section class="cover"><div class="t1">LeetCode Hot 100</div><div class="t2">题目详解 · ${contentLabel}</div><div class="t3">按「两周速通计划」Day 1–14 顺序编排</div><div class="meta">共 ${docs.length} 题 · 生成于 ${date}</div></section>`;
  // TOC grouped by day
  let toc = `<section class="toc"><h1>目录</h1>`;
  let curGroup; let open = false;
  docs.forEach((d, i) => {
    if (d.group !== curGroup) {
      if (open) toc += `</ol>`;
      curGroup = d.group; open = true;
      toc += `<div class="grp">${esc(curGroup || '题目')}</div><ol>`;
    }
    toc += `<li>${esc(d.title)}</li>`;
  });
  if (open) toc += `</ol>`;
  toc += `</section>`;
  body += toc;
}
docs.forEach((d, i) => {
  const first = i === 0 ? ' first' : '';
  body += `<section class="problem${first}">${render(d.raw)}</section>`;
});

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>LeetCode Hot 100 题目详解</title><style>${hljsCss}</style><style>${printCss}</style></head><body>${body}</body></html>`;
fs.mkdirSync(path.dirname(outHtml), { recursive: true });
fs.writeFileSync(outHtml, html, 'utf8');
console.log(`[${contentLabel}] HTML -> ${outHtml}  (${docs.length} 题, ${(html.length / 1024).toFixed(0)} KB)`);

// ---- optional print ----
if (has('print')) {
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ].filter((p) => fs.existsSync(p));
  if (!candidates.length) { console.error('未找到 Chrome/Edge。手动打开 HTML 后 Ctrl+P 打印。'); process.exit(3); }
  const bin = candidates[0];
  const user = path.join(os.tmpdir(), 'leet-pdf-profile-' + (cppOnly ? 'cpp' : 'full'));
  const fileUrl = 'file:///' + outHtml.replace(/\\/g, '/');
  console.log(`打印引擎: ${bin}`);
  try {
    execFileSync(bin, ['--headless=new', '--disable-gpu', '--no-sandbox', `--user-data-dir=${user}`, '--no-pdf-header-footer', `--print-to-pdf=${outPdf}`, '--virtual-time-budget=15000', fileUrl], { stdio: 'inherit' });
    const ok = fs.existsSync(outPdf);
    console.log(ok ? `PDF -> ${outPdf}  (${(fs.statSync(outPdf).size / 1024 / 1024).toFixed(2)} MB)` : 'PDF 未生成');
  } catch (e) { console.error('打印失败:', e.message); process.exit(4); }
}
