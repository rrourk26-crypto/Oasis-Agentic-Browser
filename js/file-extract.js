/* ===========================================================
   Oasis file reader — turns many file types into something a
   language model can use.

   Text out:   PDF, Word (docx/doc), Excel & other spreadsheets
               (xlsx/xls/xlsb/ods/numbers/…), PowerPoint (pptx/ppt),
               OpenDocument (odt/odp), RTF, EPUB, e-mail (eml/msg),
               Jupyter notebooks.
   Archives:   zip/jar/apk/… (and tar, tar.gz, tgz, gz) open like a zip.
   Images:     png/jpg/gif/webp/bmp/avif/ico are resized and returned
               as data URLs so a vision model can see them.
   Text files: a very long list of code / config / markup types, plus a
               "does this look like text?" check for unknown extensions.

   Heavy libraries (PDF.js, SheetJS) are loaded from js/vendor/ only
   the first time they are needed. Everything works offline.

   Exposed as window.OasisExtract.
   =========================================================== */
(function () {
  "use strict";

  const SCRIPT_DIR = (function () {
    try { if (document.currentScript && document.currentScript.src) return new URL(".", document.currentScript.src).href; } catch (e) {}
    try { return new URL("js/", document.baseURI).href; } catch (e) { return "js/"; }
  })();

  /* ---------- File type tables ---------- */
  const set = (s) => new Set(s.split(/\s+/).filter(Boolean));

  const TEXT_EXT = set(
    "txt text md markdown mdx rst adoc asciidoc org tex latex bib log csv tsv tab psv json jsonc json5 jsonl ndjson geojson topojson " +
    "yaml yml toml ini cfg conf config properties env editorconfig gitignore gitattributes dockerignore npmrc nvmrc eslintrc prettierrc babelrc " +
    "xml xsd xsl xslt dtd rss atom svg html htm xhtml shtml css scss sass less styl js mjs cjs jsx ts tsx mts cts vue svelte astro " +
    "py pyw pyi pyx rb erb rake gemspec php phtml java kt kts scala sc groovy gradle clj cljs cljc edn c h cc cpp cxx hpp hh hxx ino " +
    "cs csx fs fsx fsi vb vbs go rs swift m mm dart lua pl pm t r rmd jl sh bash zsh fish ksh bat cmd ps1 psm1 psd1 " +
    "sql ddl prisma graphql gql proto thrift tf tfvars hcl nix cmake make mk mak dockerfile lock sum mod srt vtt ass ssa lrc ics vcf diff patch " +
    "asm s nasm hs lhs elm erl hrl ex exs ml mli nim zig v sv vhd vhdl sol vy cu cuh glsl vert frag hlsl wgsl shader " +
    "cfm jsp asp aspx cshtml razor hbs handlebars mustache ejs pug jade twig liquid njk haml slim coffee litcoffee purs rkt scm lisp el vim " +
    "csproj vbproj fsproj sln props targets xaml plist strings resx rc def ahk au3 applescript bas pas dpr pp inc tpl tmpl webapp " +
    "mbox kml gpx tcx opml rdf owl ttl nt n3 sparql wsdl xsdl cue bzl bazel gn gni ninja mdc rmd qmd gitmodules " +
    "http rest har tsbuildinfo sbt cabal podspec gemfile rakefile jenkinsfile vagrantfile procfile"
  );
  const TEXT_NAMES = set(
    "dockerfile makefile gnumakefile license licence readme changelog changes authors contributors notice copying procfile gemfile rakefile " +
    "vagrantfile jenkinsfile brewfile codeowners cname version manifest todo thanks install news history patents owners"
  );
  const IMAGE_VIEW_EXT = set("png jpg jpeg jpe jfif pjpeg gif webp bmp avif ico apng");
  const IMAGE_OTHER_EXT = set("heic heif tif tiff psd ai eps raw cr2 nef arw dng xcf jxl jp2 tga dds exr hdr");
  const BINARY_EXT = set(
    "mp3 wav ogg oga flac aac m4a wma aiff mid midi opus mp4 m4v mov avi mkv webm wmv flv mpg mpeg 3gp " +
    "ttf otf woff woff2 eot exe dll so dylib bin dat o obj a lib class pyc pyo wasm node " +
    "7z rar bz2 xz lz lzma zst cab iso dmg img msi deb rpm snap pkg " +
    "db sqlite sqlite3 mdb accdb ldb frm ibd psb pdb ds_store " +
    "pages key sketch fig blend fbx glb max 3ds stl unitypackage asset"
  );
  const PDF_EXT = set("pdf");
  const DOCX_EXT = set("docx docm dotx dotm");
  const PPTX_EXT = set("pptx pptm ppsx ppsm potx potm");
  const SHEET_EXT = set("xlsx xlsm xlsb xls xlt xltx xltm xlam xla ods ots fods numbers dbf dif slk prn wk1 wk3 wk4 wks qpw wq1 wq2 eth sylk");
  const ODF_EXT = set("odt ott odm odg odp otp");
  const DOC_EXT = set("doc dot");
  const PPT_EXT = set("ppt pps pot");
  const RTF_EXT = set("rtf");
  const EPUB_EXT = set("epub");
  const EML_EXT = set("eml");
  const MSG_EXT = set("msg");
  const IPYNB_EXT = set("ipynb");
  const ZIP_EXT = set("zip jar war ear apk aar nupkg vsix xpi crx whl egg");
  const TAR_EXT = set("tar tgz gz");

  const LABELS = {
    pdf: "PDF", docx: "Word document", doc: "Word document (old .doc format)", pptx: "PowerPoint presentation",
    ppt: "PowerPoint presentation (old .ppt format)", sheet: "spreadsheet", odf: "OpenDocument file", rtf: "RTF document",
    epub: "e-book", eml: "e-mail", msg: "Outlook e-mail", ipynb: "Jupyter notebook"
  };
  const MIMES = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", jpe: "image/jpeg", jfif: "image/jpeg", pjpeg: "image/jpeg",
    gif: "image/gif", webp: "image/webp", bmp: "image/bmp", avif: "image/avif", ico: "image/x-icon", apng: "image/png" };

  function extOf(name) {
    const base = String(name || "").split(/[\\/]/).pop().toLowerCase();
    const i = base.lastIndexOf(".");
    return i > 0 ? base.slice(i + 1) : (i === 0 ? base.slice(1) : "");
  }
  function baseOf(name) { return String(name || "").split(/[\\/]/).pop().toLowerCase(); }

  // What kind of file is this, going by its name?
  //   text | image | imageOther | pdf | docx | pptx | sheet | odf | doc | ppt | rtf | epub | eml | msg | ipynb | zip | tar | binary | unknown
  function classify(name, mimeType) {
    const ext = extOf(name), base = baseOf(name);
    if (/\.tar\.(gz|bz2|xz)$/.test(base)) return /\.tar\.gz$/.test(base) ? "tar" : "binary";
    if (PDF_EXT.has(ext)) return "pdf";
    if (DOCX_EXT.has(ext)) return "docx";
    if (PPTX_EXT.has(ext)) return "pptx";
    if (SHEET_EXT.has(ext)) return "sheet";
    if (ODF_EXT.has(ext)) return "odf";
    if (DOC_EXT.has(ext)) return "doc";
    if (PPT_EXT.has(ext)) return "ppt";
    if (RTF_EXT.has(ext)) return "rtf";
    if (EPUB_EXT.has(ext)) return "epub";
    if (EML_EXT.has(ext)) return "eml";
    if (MSG_EXT.has(ext)) return "msg";
    if (IPYNB_EXT.has(ext)) return "ipynb";
    if (ZIP_EXT.has(ext)) return "zip";
    if (TAR_EXT.has(ext)) return "tar";
    if (IMAGE_VIEW_EXT.has(ext)) return "image";
    if (ext === "svg") return "text";
    if (IMAGE_OTHER_EXT.has(ext)) return "imageOther";
    if (TEXT_EXT.has(ext) || TEXT_NAMES.has(base)) return "text";
    if (BINARY_EXT.has(ext)) return "binary";
    if (mimeType) {
      if (/^image\/(png|jpe?g|gif|webp|bmp|avif|x-icon|vnd\.microsoft\.icon)$/i.test(mimeType)) return "image";
      if (/^image\//i.test(mimeType)) return "imageOther";
      if (/^(audio|video|font)\//i.test(mimeType)) return "binary";
      if (/^text\//i.test(mimeType)) return "text";
    }
    return "unknown";
  }
  // Kinds that get turned into text by extract().
  const DOC_KINDS = set("pdf docx pptx sheet odf doc ppt rtf epub eml msg ipynb");
  const isDoc = (name) => DOC_KINDS.has(classify(name));
  const isImage = (name) => classify(name) === "image";
  const isArchive = (name) => { const k = classify(name); return k === "zip" || k === "tar"; };
  const label = (kind) => LABELS[kind] || kind;

  // Does a chunk of bytes look like text (not binary)?
  function looksLikeText(bytes) {
    const n = Math.min(bytes.length, 8192);
    if (!n) return true;
    let bad = 0;
    for (let i = 0; i < n; i++) {
      const b = bytes[i];
      if (b === 0) return false;
      if (b < 7 || (b > 13 && b < 32 && b !== 27)) bad++;
    }
    if (bad / n > 0.02) return false;
    try { new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, n).slice(0, n)); return true; }
    catch (e) {
      // a UTF-8 character may be cut at the end of the sample; retry without the last 3 bytes
      try { new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, Math.max(0, n - 3))); return true; } catch (e2) {}
      // not UTF-8: accept it as legacy 8-bit text if it has no control characters
      return bad === 0;
    }
  }
  function decodeText(bytes) {
    let t;
    if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) t = new TextDecoder("utf-16le").decode(bytes.subarray(2));
    else if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) t = new TextDecoder("utf-16be").decode(bytes.subarray(2));
    else {
      try { t = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
      catch (e) { t = new TextDecoder("windows-1252").decode(bytes); }
    }
    return t.charCodeAt(0) === 0xFEFF ? t.slice(1) : t;
  }

  /* ---------- Loading the big libraries on demand ---------- */
  const loading = new Map();
  function loadScript(src) {
    if (loading.has(src)) return loading.get(src);
    const p = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { loading.delete(src); reject(new Error("Could not load " + src)); };
      document.head.appendChild(s);
    });
    loading.set(src, p);
    return p;
  }
  async function ensureXLSX() {
    if (window.XLSX) return window.XLSX;
    await loadScript(SCRIPT_DIR + "vendor/xlsx.full.min.js");
    if (!window.XLSX) throw new Error("spreadsheet reader failed to load");
    return window.XLSX;
  }
  async function ensurePdf() {
    if (!window.pdfjsLib) await loadScript(SCRIPT_DIR + "vendor/pdf.min.js");
    const lib = window.pdfjsLib;
    if (!lib) throw new Error("PDF reader failed to load");
    try { if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) lib.GlobalWorkerOptions.workerSrc = SCRIPT_DIR + "vendor/pdf.worker.min.js"; } catch (e) {}
    return lib;
  }
  function needJSZip() { if (typeof JSZip === "undefined") throw new Error("JSZip missing"); return JSZip; }

  /* ---------- Small helpers ---------- */
  function toBytes(data) {
    if (data instanceof Uint8Array) return Promise.resolve(data);
    if (data instanceof ArrayBuffer) return Promise.resolve(new Uint8Array(data));
    if (data && typeof data.arrayBuffer === "function") return data.arrayBuffer().then((b) => new Uint8Array(b));
    return Promise.reject(new Error("unsupported data"));
  }
  function bytesToBase64(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function parseXml(str) {
    const doc = new DOMParser().parseFromString(str, "application/xml");
    if (doc.getElementsByTagName("parsererror").length) throw new Error("bad XML");
    return doc;
  }
  function kids(n, name) { const o = []; for (const c of n.childNodes) if (c.nodeType === 1 && (!name || c.localName === name)) o.push(c); return o; }
  function kid(n, name) { for (const c of n.childNodes) if (c.nodeType === 1 && c.localName === name) return c; return null; }
  function attr(n, local) {
    if (!n || !n.attributes) return null;
    for (const a of n.attributes) if (a.localName === local) return a.value;
    return null;
  }
  function tidy(s) {
    return s.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  async function zipText(zip, path) { const f = zip.file(path); return f ? f.async("string") : null; }
  const MAX_CHARS = 4000000;   // never return more than this many characters from one file

  /* ---------- Word (.docx) ---------- */
  function wPara(p) {
    let s = "";
    (function rec(n) {
      for (const c of n.childNodes) {
        if (c.nodeType !== 1) continue;
        const t = c.localName;
        if (t === "t") s += c.textContent;
        else if (t === "tab" || t === "ptab") s += "\t";
        else if (t === "br" || t === "cr") s += "\n";
        else if (t === "noBreakHyphen") s += "-";
        else if (t === "delText" || t === "instrText" || t === "pPr" || t === "rPr" || t === "Fallback" || t === "del" || t === "fldChar") continue;
        else rec(c);
      }
    })(p);
    const ppr = kid(p, "pPr");
    let prefix = "";
    if (ppr) {
      const st = attr(kid(ppr, "pStyle"), "val") || "";
      const m = /^heading\s*(\d)/i.exec(st) || /^Heading(\d)/.exec(st);
      if (m) prefix = "#".repeat(Math.min(6, +m[1])) + " ";
      else if (/^title$/i.test(st)) prefix = "# ";
      else if (kid(ppr, "numPr") || /list/i.test(st)) {
        const lvl = +(attr(kid(kid(ppr, "numPr") || ppr, "ilvl"), "val") || 0);
        prefix = "  ".repeat(Math.min(lvl, 6)) + "- ";
      }
    }
    return s.trim() ? prefix + s : "";
  }
  function wBlocks(container, out) {
    for (const c of container.childNodes) {
      if (c.nodeType !== 1) continue;
      const t = c.localName;
      if (t === "p") { const line = wPara(c); out.push(line); }
      else if (t === "tbl") {
        for (const tr of kids(c, "tr")) {
          const cells = kids(tr, "tc").map((tc) => { const o = []; wBlocks(tc, o); return o.filter(Boolean).join(" ").replace(/\s+/g, " ").trim(); });
          out.push("| " + cells.join(" | ") + " |");
        }
        out.push("");
      }
      else if (t === "sdt") { const sc = kid(c, "sdtContent"); if (sc) wBlocks(sc, out); }
      else if (t === "sdtContent" || t === "ins" || t === "customXml" || t === "smartTag" || t === "moveTo") wBlocks(c, out);
    }
  }
  async function extractDocx(bytes) {
    const zip = await needJSZip().loadAsync(bytes);
    const mainPath = zip.file("word/document.xml") ? "word/document.xml" : Object.keys(zip.files).find((n) => /^word\/document[^/]*\.xml$/.test(n));
    if (!mainPath) throw new Error("not a Word document");
    const parts = [];
    const body = kid(parseXml(await zipText(zip, mainPath)).documentElement, "body");
    const lines = []; if (body) wBlocks(body, lines);
    parts.push(lines.join("\n"));
    const extra = async (re, title) => {
      const names = Object.keys(zip.files).filter((n) => re.test(n)).sort();
      const seen = new Set(), got = [];
      for (const n of names) {
        const o = []; wBlocks(parseXml(await zipText(zip, n)).documentElement, o);
        const t = o.filter(Boolean).join("\n").trim();
        if (t && !seen.has(t)) { seen.add(t); got.push(t); }
      }
      if (got.length) parts.push("[" + title + "]\n" + got.join("\n"));
    };
    await extra(/^word\/header\d*\.xml$/, "Header");
    await extra(/^word\/footer\d*\.xml$/, "Footer");
    for (const [path, title] of [["word/footnotes.xml", "Footnotes"], ["word/endnotes.xml", "Endnotes"]]) {
      const x = await zipText(zip, path); if (!x) continue;
      const notes = [];
      for (const fn of kids(parseXml(x).documentElement)) {
        const ty = attr(fn, "type"); if (ty === "separator" || ty === "continuationSeparator" || ty === "continuationNotice") continue;
        const o = []; wBlocks(fn, o); const t = o.filter(Boolean).join(" ").trim(); if (t) notes.push("- " + t);
      }
      if (notes.length) parts.push("[" + title + "]\n" + notes.join("\n"));
    }
    const cx = await zipText(zip, "word/comments.xml");
    if (cx) {
      const notes = [];
      for (const cm of kids(parseXml(cx).documentElement, "comment")) {
        const o = []; wBlocks(cm, o); const t = o.filter(Boolean).join(" ").trim();
        if (t) notes.push("- " + (attr(cm, "author") ? attr(cm, "author") + ": " : "") + t);
      }
      if (notes.length) parts.push("[Comments]\n" + notes.join("\n"));
    }
    return tidy(parts.join("\n\n"));
  }

  /* ---------- PowerPoint (.pptx) ---------- */
  function aPara(p) {
    let s = "";
    (function rec(n) {
      for (const c of n.childNodes) {
        if (c.nodeType !== 1) continue;
        const t = c.localName;
        if (t === "t") s += c.textContent;
        else if (t === "br") s += "\n";
        else if (t === "pPr" || t === "rPr" || t === "endParaRPr") continue;
        else rec(c);
      }
    })(p);
    return s;
  }
  const SKIP_PH = set("sldNum hdr ftr dt sldImg");
  function aBlocks(n, out) {
    for (const c of n.childNodes) {
      if (c.nodeType !== 1) continue;
      const t = c.localName;
      if (t === "sp") {
        const nv = kid(c, "nvSpPr"), nvPr = nv && kid(nv, "nvPr"), ph = nvPr && kid(nvPr, "ph");
        if (ph && SKIP_PH.has(attr(ph, "type") || "")) continue;
        aBlocks(c, out);
      }
      else if (t === "p" && c.namespaceURI && /drawingml/.test(c.namespaceURI)) { const l = aPara(c); if (l.trim()) out.push(l); }
      else if (t === "tbl") {
        for (const tr of kids(c, "tr")) {
          const cells = kids(tr, "tc").map((tc) => { const o = []; aBlocks(tc, o); return o.join(" ").replace(/\s+/g, " ").trim(); });
          out.push("| " + cells.join(" | ") + " |");
        }
      }
      else aBlocks(c, out);
    }
  }
  function relsMap(xml) {
    const m = new Map();
    if (!xml) return m;
    for (const r of parseXml(xml).getElementsByTagName("Relationship")) m.set(r.getAttribute("Id"), { target: r.getAttribute("Target"), type: r.getAttribute("Type") || "" });
    return m;
  }
  function resolvePath(base, target) {   // base: path of the file that holds the link; target: relative link
    if (/^\//.test(target)) return target.slice(1);
    const parts = base.split("/"); parts.pop();
    for (const seg of decodeURIComponent(target).split("/")) { if (seg === "..") parts.pop(); else if (seg && seg !== ".") parts.push(seg); }
    return parts.join("/");
  }
  async function extractPptx(bytes) {
    const zip = await needJSZip().loadAsync(bytes);
    let slidePaths = [];
    const pres = await zipText(zip, "ppt/presentation.xml");
    if (pres) {
      const rels = relsMap(await zipText(zip, "ppt/_rels/presentation.xml.rels"));
      for (const el of parseXml(pres).getElementsByTagName("*")) {
        if (el.localName !== "sldId") continue;
        const key = el.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") || el.getAttribute("r:id");
        const r = key && rels.get(key); if (r) slidePaths.push(resolvePath("ppt/presentation.xml", r.target));
      }
    }
    if (!slidePaths.length) slidePaths = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => parseInt(a.match(/(\d+)\.xml$/)[1], 10) - parseInt(b.match(/(\d+)\.xml$/)[1], 10));
    if (!slidePaths.length) throw new Error("no slides found");
    const out = [];
    let i = 0;
    for (const sp of slidePaths) {
      const x = await zipText(zip, sp); if (!x) continue;
      i++;
      const lines = []; aBlocks(parseXml(x).documentElement, lines);
      let notes = "";
      const relPath = sp.replace(/([^/]+)$/, "_rels/$1.rels");
      for (const r of relsMap(await zipText(zip, relPath)).values()) {
        if (/notesSlide$/.test(r.type)) {
          const nx = await zipText(zip, resolvePath(sp, r.target));
          if (nx) { const nl = []; aBlocks(parseXml(nx).documentElement, nl); notes = nl.join("\n").trim(); }
        }
      }
      out.push("--- Slide " + i + " ---\n" + lines.join("\n") + (notes ? "\n[Speaker notes]\n" + notes : ""));
    }
    return tidy(out.join("\n\n"));
  }

  /* ---------- OpenDocument (.odt / .odp / .odg) ---------- */
  function odfPara(p) {
    let s = "";
    (function rec(n) {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) { s += c.nodeValue; continue; }
        if (c.nodeType !== 1) continue;
        const t = c.localName;
        if (t === "s") s += " ".repeat(Math.min(+(attr(c, "c") || 1), 50));
        else if (t === "tab") s += "\t";
        else if (t === "line-break") s += "\n";
        else if (t === "note-citation" || t === "annotation-end") continue;
        else rec(c);
      }
    })(p);
    return s;
  }
  function odfBlocks(n, out, st) {
    for (const c of n.childNodes) {
      if (c.nodeType !== 1) continue;
      const t = c.localName;
      if (t === "h") { const lvl = Math.min(6, +(attr(c, "outline-level") || 1)); const l = odfPara(c).trim(); if (l) out.push("#".repeat(lvl) + " " + l); }
      else if (t === "p") { const l = odfPara(c); if (l.trim() && !/^(<number>|\u2039#\u203A|<page-number>)$/.test(l.trim())) out.push((st.inList ? "- " : "") + l); }
      else if (t === "list") { const prev = st.inList; st.inList = true; odfBlocks(c, out, st); st.inList = prev; }
      else if (t === "table") {
        for (const tr of c.getElementsByTagName("*")) {
          if (tr.localName !== "table-row") continue;
          const cells = kids(tr).filter((x) => x.localName === "table-cell" || x.localName === "covered-table-cell").map((tc) => { const o = []; odfBlocks(tc, o, { inList: false }); return o.join(" ").replace(/\s+/g, " ").trim(); });
          out.push("| " + cells.join(" | ") + " |");
        }
      }
      else if (t === "page" && c.namespaceURI && /drawing/.test(c.namespaceURI)) { st.page = (st.page || 0) + 1; out.push("--- Slide " + st.page + " ---"); odfBlocks(c, out, st); }
      else if (t === "annotation") { const o = []; odfBlocks(c, o, { inList: false }); if (o.length) out.push("[Comment] " + o.join(" ")); }
      else odfBlocks(c, out, st);
    }
  }
  async function extractOdf(bytes) {
    const zip = await needJSZip().loadAsync(bytes);
    const x = await zipText(zip, "content.xml"); if (!x) throw new Error("not an OpenDocument file");
    const out = []; odfBlocks(parseXml(x).documentElement, out, { inList: false });
    return tidy(out.join("\n"));
  }

  /* ---------- RTF ---------- */
  const CP1252 = "\u20AC\u0081\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u008D\u017D\u008F\u0090\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u009D\u017E\u0178";
  const RTF_SKIP = set("listtext pntext fonttbl colortbl stylesheet info pict themedata colorschememapping latentstyles datastore xmlnstbl listtable listoverridetable rsidtbl generator private fldinst bkmkstart bkmkend nonshppict shpinst upr");
  const RTF_CHARS = { par: "\n", line: "\n", sect: "\n\n", page: "\n\n", tab: "\t", cell: " | ", row: "\n", emdash: "\u2014", endash: "\u2013", bullet: "\u2022", lquote: "\u2018", rquote: "\u2019", ldblquote: "\u201C", rdblquote: "\u201D", emspace: " ", enspace: " ", qmspace: " " };
  function rtfToText(s) {
    let out = "", i = 0; const n = s.length;
    const stack = []; let cur = { skip: false, uc: 1 }; let ucSkip = 0;
    const emit = (txt) => { if (!cur.skip) out += txt; };
    while (i < n) {
      const ch = s[i];
      if (ch === "{") { stack.push(cur); cur = { skip: cur.skip, uc: cur.uc }; i++; }
      else if (ch === "}") { cur = stack.pop() || { skip: false, uc: 1 }; i++; }
      else if (ch === "\\") {
        i++; const c = s[i];
        if (c === undefined) break;
        if (c === "\\" || c === "{" || c === "}") { if (ucSkip > 0) ucSkip--; else emit(c); i++; }
        else if (c === "~") { emit("\u00A0"); i++; }
        else if (c === "-") { i++; }
        else if (c === "_") { emit("-"); i++; }
        else if (c === "*") { cur.skip = true; i++; }
        else if (c === "'") {
          const hex = s.substr(i + 1, 2); i += 3;
          if (ucSkip > 0) { ucSkip--; continue; }
          const code = parseInt(hex, 16);
          if (!isNaN(code)) emit(code >= 0x80 && code <= 0x9F ? CP1252[code - 0x80] : String.fromCharCode(code));
        }
        else if (c === "\n" || c === "\r") { emit("\n"); i++; }
        else if (/[a-zA-Z]/.test(c)) {
          let j = i; while (j < n && /[a-zA-Z]/.test(s[j])) j++;
          const word = s.slice(i, j);
          let k = j; if (s[k] === "-") k++;
          while (k < n && /[0-9]/.test(s[k])) k++;
          const param = s.slice(j, k);
          if (s[k] === " ") k++;
          i = k;
          if (RTF_SKIP.has(word)) cur.skip = true;
          else if (word === "u") {
            let code = parseInt(param, 10); if (code < 0) code += 65536;
            if (!isNaN(code)) emit(String.fromCharCode(code));
            ucSkip = cur.uc;
          }
          else if (word === "uc") cur.uc = parseInt(param, 10) || 0;
          else if (RTF_CHARS[word] !== undefined) emit(RTF_CHARS[word]);
        }
        else i++;
      }
      else if (ch === "\r" || ch === "\n") { i++; }
      else { if (ucSkip > 0) { ucSkip--; } else emit(ch); i++; }
    }
    return tidy(out);
  }
  async function extractRtf(bytes) {
    const s = new TextDecoder("windows-1252").decode(bytes);
    if (!/^\s*\{\\rtf/.test(s)) throw new Error("not an RTF file");
    return rtfToText(s);
  }

  /* ---------- Spreadsheets (SheetJS) ---------- */
  async function extractSheet(bytes) {
    const X = await ensureXLSX();
    const wb = X.read(bytes, { type: "array", cellDates: true, cellFormula: true, cellNF: false, cellStyles: false, sheetStubs: true });
    const out = [];
    const hiddenOf = (i) => { const s = wb.Workbook && wb.Workbook.Sheets && wb.Workbook.Sheets[i]; return s && s.Hidden ? " (hidden)" : ""; };
    wb.SheetNames.forEach((name, idx) => {
      const ws = wb.Sheets[name]; if (!ws || !ws["!ref"]) { out.push("=== Sheet: " + name + hiddenOf(idx) + " (empty) ==="); return; }
      for (const addr in ws) {   // formula cells with no saved result (files made by scripts) would show blank; show the formula instead
        if (addr[0] === "!") continue;
        const c = ws[addr];
        if (c && c.f && (c.t === "z" || c.v === undefined || c.v === "")) { c.t = "s"; c.v = "=" + c.f; delete c.w; }
      }
      const range = X.utils.decode_range(ws["!ref"]);
      const rows = range.e.r - range.s.r + 1, cols = range.e.c - range.s.c + 1;
      let csv = X.utils.sheet_to_csv(ws, { FS: ",", RS: "\n", blankrows: false, strip: false });
      const lines = csv.split("\n"); const MAXROWS = 5000;
      let note = "";
      if (lines.length > MAXROWS) { csv = lines.slice(0, MAXROWS).join("\n"); note = "\n...[" + (lines.length - MAXROWS) + " more rows not shown]"; }
      const fl = [];
      for (const addr in ws) {
        if (addr[0] === "!") continue;
        const c = ws[addr];
        if (c && c.f && fl.length < 200) fl.push(addr + ": =" + c.f);
      }
      out.push("=== Sheet: " + name + hiddenOf(idx) + " (" + rows + " rows × " + cols + " columns) ===\n" + csv + note + (fl.length ? "\n[Formulas]\n" + fl.join("\n") : ""));
    });
    return tidy(out.join("\n\n"));
  }

  /* ---------- Old binary Office files (.doc / .ppt) via the CFB container ---------- */
  async function cfbOpen(bytes) {
    const X = await ensureXLSX();
    if (!X.CFB) throw new Error("container reader missing");
    return { X, cfb: X.CFB.read(bytes, { type: "array" }) };
  }
  function cfbStream(X, cfb, name) {
    const f = X.CFB.find(cfb, name); if (!f || !f.content) return null;
    const c = f.content; return c instanceof Uint8Array ? c : Uint8Array.from(c);
  }
  function printableRuns(bytes) {   // last-resort text recovery
    const parts = []; let cur = "";
    const flush = () => { if (cur.trim().length >= 8) parts.push(cur.trim()); cur = ""; };
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if ((b >= 32 && b < 127) || b === 9 || b === 10 || b === 13 || b >= 0xA0) cur += String.fromCharCode(b); else flush();
    }
    flush();
    return parts.join("\n");
  }
  async function extractDoc(bytes) {
    const { X, cfb } = await cfbOpen(bytes);
    const wd = cfbStream(X, cfb, "/WordDocument"); if (!wd) throw new Error("not a Word .doc file");
    const dv = new DataView(wd.buffer, wd.byteOffset, wd.byteLength);
    let text = "";
    try {
      const flags = dv.getUint16(0x0A, true);
      const tbl = cfbStream(X, cfb, (flags & 0x0200) ? "/1Table" : "/0Table");
      const ccpText = dv.getInt32(0x4C, true);
      const ccpFtn = dv.getInt32(0x50, true);
      const fcClx = dv.getUint32(0x01A2, true), lcbClx = dv.getUint32(0x01A6, true);
      if (!tbl || !lcbClx) throw new Error("no piece table");
      const tv = new DataView(tbl.buffer, tbl.byteOffset, tbl.byteLength);
      let p = fcClx; const end = fcClx + lcbClx;
      while (p < end && tbl[p] === 0x01) p += 3 + tv.getUint16(p + 1, true);   // skip Prc entries
      if (tbl[p] !== 0x02) throw new Error("no Pcdt");
      const lcb = tv.getUint32(p + 1, true); p += 5;
      const n = (lcb - 4) / 12 | 0;
      const cps = []; for (let i = 0; i <= n; i++) cps.push(tv.getInt32(p + i * 4, true));
      const pcdStart = p + (n + 1) * 4;
      const total = ccpText + ccpFtn;   // main text, then footnotes
      for (let i = 0; i < n; i++) {
        const fcRaw = tv.getUint32(pcdStart + i * 8 + 2, true);
        const compressed = (fcRaw & 0x40000000) !== 0;
        const fc = fcRaw & 0x3FFFFFFF;
        const from = cps[i], to = Math.min(cps[i + 1], total);
        if (to <= from) continue;
        const len = to - from;
        if (compressed) {
          const off = fc >> 1;
          let s = ""; for (let k = 0; k < len && off + k < wd.length; k++) { const b = wd[off + k]; s += (b >= 0x80 && b <= 0x9F) ? CP1252[b - 0x80] : String.fromCharCode(b); }
          text += s;
        } else {
          text += new TextDecoder("utf-16le").decode(wd.subarray(fc, Math.min(wd.length, fc + len * 2)));
        }
      }
    } catch (e) { text = ""; }
    if (!text.trim()) return tidy(printableRuns(wd));
    text = text.replace(/\r?\x07\x07/g, "\n").replace(/\r?\x07/g, " | ").replace(/\r/g, "\n").replace(/\x0B/g, "\n").replace(/\x0C/g, "\n\n")
      .replace(/\x13[^\x14\x15]*\x14?/g, "").replace(/[\x01-\x08\x0E-\x1F\x15]/g, "");   // drop field codes and control characters
    return tidy(text);
  }
  function pptRecords(buf, start, end, out, st) {
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let p = start;
    while (p + 8 <= end) {
      const verInst = dv.getUint16(p, true), type = dv.getUint16(p + 2, true), len = dv.getUint32(p + 4, true);
      const ver = verInst & 0x0F;
      const bodyStart = p + 8, bodyEnd = Math.min(end, bodyStart + len);
      if (type === 0x03F8 || type === 0x03F2 || type === 0x0FC9) { p = bodyStart + len; continue; }   // masters: boilerplate prompts, not content
      if (type === 0x03EE) { st.slide++; out.push("\n--- Slide " + st.slide + " ---"); }
      if (type === 0x03F0) {   // notes page: label it only if it holds real text
        const sub = []; pptRecords(buf, bodyStart, bodyEnd, sub, st);
        const keep = sub.map((x) => x.trim()).filter((x) => x && !/^[*\u2039#\u203A<>\d\s]+$/.test(x));
        if (keep.length) out.push("[Speaker notes]\n" + keep.join("\n"));
        p = bodyStart + len; continue;
      }
      if (ver === 0x0F) pptRecords(buf, bodyStart, bodyEnd, out, st);
      else if (type === 0x0FA0) out.push(new TextDecoder("utf-16le").decode(buf.subarray(bodyStart, bodyEnd)));
      else if (type === 0x0FA8) { let s = ""; for (let k = bodyStart; k < bodyEnd; k++) { const b = buf[k]; s += (b >= 0x80 && b <= 0x9F) ? CP1252[b - 0x80] : String.fromCharCode(b); } out.push(s); }
      p = bodyStart + len;
    }
  }
  async function extractPpt(bytes) {
    const { X, cfb } = await cfbOpen(bytes);
    const s = cfbStream(X, cfb, "/PowerPoint Document"); if (!s) throw new Error("not a PowerPoint .ppt file");
    const out = []; pptRecords(s, 0, s.length, out, { slide: 0 });
    const text = out.join("\n").replace(/\r/g, "\n").replace(/\x0B/g, "\n").replace(/[\x00-\x08\x0E-\x1F]/g, "");
    return tidy(text) || tidy(printableRuns(s));
  }

  /* ---------- EPUB ---------- */
  function htmlToText(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script,style,head,noscript,svg").forEach((e) => e.remove());
    doc.querySelectorAll("tr").forEach((tr) => {
      const cells = Array.from(tr.children).filter((c) => /^t[dh]$/i.test(c.tagName)).map((c) => c.textContent.replace(/\s+/g, " ").trim());
      const row = doc.createElement("p"); row.textContent = "| " + cells.join(" | ") + " |"; tr.replaceWith(row);
    });
    doc.querySelectorAll("br").forEach((e) => e.replaceWith(doc.createTextNode("\n")));
    doc.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((e) => { e.prepend(doc.createTextNode("\n" + "#".repeat(+e.tagName[1]) + " ")); e.append(doc.createTextNode("\n")); });
    doc.querySelectorAll("li").forEach((e) => e.prepend(doc.createTextNode("\n- ")));
    doc.querySelectorAll("p,div,section,article,blockquote,pre,tr,table,ul,ol,hr").forEach((e) => e.append(doc.createTextNode("\n")));
    return tidy((doc.body ? doc.body.textContent : doc.documentElement.textContent) || "");
  }
  async function extractEpub(bytes) {
    const zip = await needJSZip().loadAsync(bytes);
    const cont = await zipText(zip, "META-INF/container.xml"); if (!cont) throw new Error("not an EPUB");
    const rf = parseXml(cont).getElementsByTagName("rootfile")[0];
    const opfPath = rf && rf.getAttribute("full-path"); if (!opfPath) throw new Error("EPUB has no package file");
    const opf = parseXml(await zipText(zip, opfPath));
    const items = new Map();
    for (const it of opf.getElementsByTagName("item")) items.set(it.getAttribute("id"), it.getAttribute("href"));
    const titleEl = opf.getElementsByTagName("dc:title")[0] || Array.from(opf.getElementsByTagName("*")).find((e) => e.localName === "title");
    const out = []; if (titleEl) out.push("# " + titleEl.textContent.trim());
    for (const ir of opf.getElementsByTagName("itemref")) {
      const href = items.get(ir.getAttribute("idref")); if (!href) continue;
      const path = resolvePath(opfPath, href);
      const f = zip.file(path); if (!f || !/\.(x?html?|xml)$/i.test(path)) continue;
      const t = htmlToText(await f.async("string")); if (t) out.push(t);
      if (out.join("").length > MAX_CHARS) break;
    }
    return tidy(out.join("\n\n"));
  }

  /* ---------- E-mail ---------- */
  function decodeWords(s) {
    return s.replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g, (m, cs, enc, data) => {
      try {
        let b;
        if (/b/i.test(enc)) b = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
        else b = Uint8Array.from(data.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (x, h) => String.fromCharCode(parseInt(h, 16))), (c) => c.charCodeAt(0));
        return new TextDecoder(cs).decode(b);
      } catch (e) { return m; }
    });
  }
  function parseMime(raw) {
    const m = /\r?\n\r?\n/.exec(raw);
    const headText = m ? raw.slice(0, m.index) : raw, body = m ? raw.slice(m.index + m[0].length) : "";
    const headers = {};
    headText.replace(/\r?\n[ \t]+/g, " ").split(/\r?\n/).forEach((l) => { const i = l.indexOf(":"); if (i > 0) { const k = l.slice(0, i).toLowerCase(); if (!(k in headers)) headers[k] = decodeWords(l.slice(i + 1).trim()); } });
    return { headers, body };
  }
  function decodeBody(body, enc, charset) {
    let bytes;
    enc = (enc || "").toLowerCase();
    if (enc === "base64") { try { bytes = Uint8Array.from(atob(body.replace(/\s+/g, "")), (c) => c.charCodeAt(0)); } catch (e) { return body; } }
    else if (enc === "quoted-printable") {
      const s = body.replace(/=\r?\n/g, "").replace(/=([0-9A-Fa-f]{2})/g, (x, h) => String.fromCharCode(parseInt(h, 16)));
      bytes = Uint8Array.from(s, (c) => c.charCodeAt(0) & 255);
    } else return body;
    try { return new TextDecoder(charset || "utf-8").decode(bytes); } catch (e) { return new TextDecoder().decode(bytes); }
  }
  function mimeBodies(raw, acc) {
    const { headers, body } = parseMime(raw);
    const ct = headers["content-type"] || "text/plain";
    const type = ct.split(";")[0].trim().toLowerCase();
    const bm = /boundary="?([^";]+)"?/i.exec(ct);
    const disp = headers["content-disposition"] || "";
    const fn = /filename\*?="?([^";]+)"?/i.exec(disp) || /name="?([^";]+)"?/i.exec(ct);
    if (type.startsWith("multipart/") && bm) {
      const sep = "--" + bm[1];
      body.split(sep).slice(1).forEach((part) => { if (part.startsWith("--")) return; mimeBodies(part.replace(/^\r?\n/, ""), acc); });
    } else if (/attachment/i.test(disp) || (fn && !/^text\/(plain|html)$/.test(type))) {
      acc.attachments.push(decodeWords(fn ? fn[1] : "(unnamed)"));
    } else if (type === "text/plain" || type === "text/html") {
      const cs = (/charset="?([^";]+)"?/i.exec(ct) || [])[1];
      const txt = decodeBody(body, headers["content-transfer-encoding"], cs);
      (type === "text/plain" ? acc.plain : acc.html).push(type === "text/html" ? htmlToText(txt) : txt);
    }
  }
  async function extractEml(bytes) {
    const raw = new TextDecoder("utf-8").decode(bytes);
    const { headers } = parseMime(raw);
    const acc = { plain: [], html: [], attachments: [] };
    mimeBodies(raw, acc);
    const h = ["from", "to", "cc", "date", "subject"].filter((k) => headers[k]).map((k) => k[0].toUpperCase() + k.slice(1) + ": " + headers[k]);
    const body = (acc.plain.length ? acc.plain : acc.html).join("\n\n");
    return tidy(h.join("\n") + "\n\n" + body + (acc.attachments.length ? "\n\n[Attachments: " + acc.attachments.join(", ") + "]" : ""));
  }
  async function extractMsg(bytes) {
    const { X, cfb } = await cfbOpen(bytes);
    const get = (tag) => {
      const u = cfbStream(X, cfb, "/__substg1.0_" + tag + "001F"); if (u) return new TextDecoder("utf-16le").decode(u).replace(/\0+$/, "");
      const a = cfbStream(X, cfb, "/__substg1.0_" + tag + "001E"); if (a) return new TextDecoder("windows-1252").decode(a).replace(/\0+$/, "");
      return "";
    };
    const subject = get("0037"), from = get("0C1A"), to = get("0E04"), cc = get("0E03"), body = get("1000");
    if (!subject && !body) throw new Error("not an Outlook .msg file");
    const att = [];
    for (const p of cfb.FullPaths || []) {
      const m = /^Root Entry\/(__attach_version1\.0_#\d+)\/$/.exec(p);
      if (m) { const n = cfbStream(X, cfb, "/" + m[1] + "/__substg1.0_3707001F"); if (n) att.push(new TextDecoder("utf-16le").decode(n).replace(/\0+$/, "")); }
    }
    const head = [];
    if (from) head.push("From: " + from); if (to) head.push("To: " + to); if (cc) head.push("Cc: " + cc); if (subject) head.push("Subject: " + subject);
    return tidy(head.join("\n") + "\n\n" + body + (att.length ? "\n\n[Attachments: " + att.join(", ") + "]" : ""));
  }

  /* ---------- Jupyter notebooks ---------- */
  async function extractIpynb(bytes) {
    const nb = JSON.parse(decodeText(bytes));
    const cells = nb.cells || (nb.worksheets && nb.worksheets[0] && nb.worksheets[0].cells) || [];
    const lang = (nb.metadata && ((nb.metadata.kernelspec && nb.metadata.kernelspec.language) || (nb.metadata.language_info && nb.metadata.language_info.name))) || "";
    const join = (x) => Array.isArray(x) ? x.join("") : String(x || "");
    const out = [];
    cells.forEach((c, i) => {
      const src = join(c.source || c.input);
      if (c.cell_type === "markdown" || c.cell_type === "raw") out.push(src);
      else if (c.cell_type === "code" || c.cell_type === undefined) {
        out.push("```" + lang + "\n" + src + "\n```");
        const outs = (c.outputs || []).map((o) => {
          if (o.output_type === "stream") return join(o.text);
          if (o.output_type === "error") return (o.ename || "Error") + ": " + (o.evalue || "");
          const d = o.data || {}; if (d["text/plain"]) return join(d["text/plain"]);
          return (d["image/png"] || d["image/jpeg"]) ? "[image output]" : "";
        }).filter(Boolean).join("\n").trim();
        if (outs) out.push("Output:\n" + outs.slice(0, 4000));
      }
    });
    return tidy(out.join("\n\n"));
  }

  /* ---------- PDF ---------- */
  async function pdfOpen(bytes) {
    const lib = await ensurePdf();
    return lib.getDocument({
      data: bytes.slice(),   // PDF.js takes ownership of the buffer it is given, so give it a copy
      isEvalSupported: false,   // keeps hostile PDFs from running code
      cMapUrl: SCRIPT_DIR + "vendor/cmaps/", cMapPacked: true,
      disableFontFace: true, verbosity: 0
    }).promise;
  }
  async function extractPdf(bytes, opts) {
    let doc;
    try { doc = await pdfOpen(bytes); }
    catch (e) {
      if (e && e.name === "PasswordException") throw new Error("this PDF is password-protected");
      throw e;
    }
    const n = doc.numPages, out = []; let chars = 0, pagesDone = 0;
    const maxPages = (opts && opts.maxPages) || 3000;
    for (let i = 1; i <= Math.min(n, maxPages); i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      let line = "", lines = [], prev = null;
      for (const it of tc.items) {
        if (typeof it.str !== "string") continue;
        const x = it.transform ? it.transform[4] : 0, y = it.transform ? it.transform[5] : 0, h = it.height || Math.abs(it.transform ? it.transform[3] : 10) || 10;
        if (prev) {
          if (Math.abs(y - prev.y) > h * 0.6) { lines.push(line); line = ""; }
          else if (it.str && line && !/\s$/.test(line) && !/^\s/.test(it.str) && x - (prev.x + prev.w) > h * 0.18) line += " ";
        }
        line += it.str;
        if (it.hasEOL) { lines.push(line); line = ""; prev = null; } else prev = { x, y, w: it.width || 0 };
      }
      if (line) lines.push(line);
      const pageText = lines.map((l) => l.replace(/[ \t]+$/, "")).join("\n").trim();
      chars += pageText.length; pagesDone++;
      out.push("--- Page " + i + " ---\n" + pageText);
      try { page.cleanup(); } catch (e) {}
      if (chars > MAX_CHARS) { out.push("...[stopped after " + i + " of " + n + " pages: very large PDF]"); break; }
    }
    let meta = "";
    try { const m = await doc.getMetadata(); const t = m && m.info && m.info.Title; if (t) meta = "Title: " + t + "\n"; } catch (e) {}
    try { doc.destroy(); } catch (e) {}
    const scanned = pagesDone > 0 && chars / pagesDone < 25;
    return { text: tidy(meta + out.join("\n\n")), pages: n, scanned };
  }
  // Draw PDF pages (1-based) to JPEG data URLs, e.g. for scanned PDFs a vision model can read.
  async function renderPdfPages(data, startPage, count, opts) {
    const bytes = await toBytes(data);
    const doc = await pdfOpen(bytes);
    const maxSide = (opts && opts.maxSide) || 1400, out = [];
    try {
      const last = Math.min(doc.numPages, startPage + count - 1);
      for (let i = Math.max(1, startPage); i <= last; i++) {
        const page = await doc.getPage(i);
        const v1 = page.getViewport({ scale: 1 });
        const scale = Math.min(3, maxSide / Math.max(v1.width, v1.height));
        const vp = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        out.push({ page: i, dataUrl: canvas.toDataURL("image/jpeg", 0.85), width: canvas.width, height: canvas.height });
        try { page.cleanup(); } catch (e) {}
      }
      out.total = doc.numPages;
    } finally { try { doc.destroy(); } catch (e) {} }
    return out;
  }

  /* ---------- Archives: zip family, tar, tar.gz, gz ---------- */
  async function gunzip(bytes) {
    if (typeof DecompressionStream === "undefined") throw new Error("this system can't open .gz files");
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  function untar(bytes) {
    const files = []; let p = 0, longName = null, paxPath = null;
    const str = (a, b) => { let s = ""; for (let i = a; i < b && bytes[i]; i++) s += String.fromCharCode(bytes[i]); return s; };
    const dec = (a, b) => new TextDecoder().decode(bytes.subarray(a, b)).replace(/\0+$/, "");
    while (p + 512 <= bytes.length) {
      if (bytes[p] === 0) { p += 512; if (p + 512 <= bytes.length && bytes[p] === 0) break; continue; }
      let name = dec(p, p + 100);
      const size = parseInt(str(p + 124, p + 136).trim() || "0", 8) || 0;
      const type = String.fromCharCode(bytes[p + 156] || 48);
      const prefix = dec(p + 345, p + 500);
      const magic = str(p + 257, p + 262);
      if (magic === "ustar" && prefix) name = prefix + "/" + name;
      const dataStart = p + 512;
      if (type === "L") { longName = dec(dataStart, dataStart + size); }
      else if (type === "x") {
        const txt = dec(dataStart, dataStart + size);
        const m = /\d+ path=([^\n]+)\n/.exec(txt); if (m) paxPath = m[1];
      }
      else if (type === "0" || type === "\0" || type === "7") {
        files.push({ name: (paxPath || longName || name).replace(/^\.\//, ""), data: bytes.subarray(dataStart, dataStart + size) });
        longName = null; paxPath = null;
      } else { if (type !== "g") { longName = null; paxPath = null; } }
      p = dataStart + Math.ceil(size / 512) * 512;
    }
    return files;
  }
  // Open zip / jar / apk / tar / tar.gz / tgz / gz as a JSZip object. Returns { zip, converted }.
  async function openArchive(file, name) {
    const J = needJSZip();
    name = name || file.name || "";
    const kind = classify(name);
    if (kind !== "tar") {
      try { return { zip: await J.loadAsync(file), converted: false }; }
      catch (e) { if (kind === "zip") throw e; }
    }
    let bytes = await toBytes(file);
    const isGz = bytes[0] === 0x1F && bytes[1] === 0x8B;
    if (isGz) bytes = await gunzip(bytes);
    const looksTar = bytes.length > 512 && String.fromCharCode.apply(null, bytes.subarray(257, 262)) === "ustar";
    const z = new J();
    if (looksTar || /\.(tar|tgz)$/i.test(name) || /\.tar\.gz$/i.test(name)) {
      const files = untar(bytes);
      if (!files.length) throw new Error("empty or unreadable tar file");
      files.forEach((f) => z.file(f.name, f.data));
    } else if (isGz) {
      z.file(name.replace(/\.gz$/i, "") || "file", bytes);
    } else if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
      return { zip: await J.loadAsync(bytes), converted: false };
    } else throw new Error("not an archive");
    return { zip: z, converted: true };
  }

  /* ---------- Images ---------- */
  function loadImg(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob), img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("could not decode image")); };
      img.src = url;
    });
  }
  // Resize an image so it is cheap to send to a model. Returns { dataUrl, width, height, outWidth, outHeight, bytes }.
  async function imageToDataUrl(data, name, opts) {
    opts = opts || {};
    const maxSide = opts.maxSide || 1280, quality = opts.quality || 0.88;
    const bytes = await toBytes(data);
    const ext = extOf(name), mime = MIMES[ext] || (data && data.type) || "image/png";
    const blob = new Blob([bytes], { type: mime });
    let bmp;
    try { bmp = await createImageBitmap(blob); } catch (e) { bmp = await loadImg(blob); }
    const w = bmp.width, h = bmp.height;
    if (!w || !h) throw new Error("empty image");
    const scale = Math.min(1, maxSide / Math.max(w, h));
    if (scale === 1 && bytes.length <= 400 * 1024 && /^image\/(png|jpeg)$/.test(mime)) {   // already small: send as is
      if (bmp.close) try { bmp.close(); } catch (e) {}
      return { dataUrl: "data:" + mime + ";base64," + bytesToBase64(bytes), width: w, height: h, outWidth: w, outHeight: h, bytes: bytes.length };
    }
    const tw = Math.max(1, Math.round(w * scale)), th = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement("canvas"); canvas.width = tw; canvas.height = th;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, tw, th);   // transparent pixels become white, not black
    ctx.drawImage(bmp, 0, 0, tw, th);
    if (bmp.close) try { bmp.close(); } catch (e) {}
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    return { dataUrl, width: w, height: h, outWidth: tw, outHeight: th, bytes: Math.round(dataUrl.length * 0.75) };
  }

  /* ---------- Main entry: file -> text ---------- */
  const EXTRACTORS = { pdf: null, docx: extractDocx, pptx: extractPptx, sheet: extractSheet, odf: extractOdf, doc: extractDoc, ppt: extractPpt,
    rtf: extractRtf, epub: extractEpub, eml: extractEml, msg: extractMsg, ipynb: extractIpynb };

  // extract(name, data) -> { ok, kind, label, text, pages?, scanned?, error? }
  async function extract(name, data, opts) {
    const kind = classify(name);
    if (!DOC_KINDS.has(kind)) return { ok: false, kind, error: "not a document type" };
    try {
      const bytes = await toBytes(data);
      let text, extra = {};
      // A file renamed to the wrong extension still works if its contents say what it is.
      let k = kind;
      if (k === "sheet" && bytes[0] === 0x25 && bytes[1] === 0x50) k = "pdf";
      if (k === "pdf") { const r = await extractPdf(bytes, opts); text = r.text; extra = { pages: r.pages, scanned: r.scanned }; }
      else text = await EXTRACTORS[k](bytes, opts);
      if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS) + "\n...[cut: very large file]";
      return Object.assign({ ok: true, kind: k, label: label(k), text }, extra);
    } catch (e) {
      return { ok: false, kind, label: label(kind), error: (e && e.message) || String(e) };
    }
  }

  window.OasisExtract = {
    classify, isDoc, isImage, isArchive, label, extOf, looksLikeText, decodeText,
    extract, imageToDataUrl, renderPdfPages, openArchive, htmlToText, rtfToText,
    toBytes, bytesToBase64,
    IMAGE_VIEW_EXT, DOC_KINDS
  };
})();
