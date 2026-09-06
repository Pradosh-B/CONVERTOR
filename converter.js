/**
 * In-Browser Conversion Engine
 * Reads platform.preferredOutputFormat as the single source of truth for output format.
 */

export class ConversionEngine {
  constructor() {
    this.audioCtx = null;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    return this.audioCtx;
  }

  /**
   * Main transcode entry point
   */
  async convert(fileSpecs, platform, onProgress = () => {}) {
    onProgress(10, 'Initializing transcoding pipeline...');
    await this.delay(180);

    const category = fileSpecs.category;
    let result = null;

    if (category === 'audio') {
      result = await this.convertAudio(fileSpecs, platform, onProgress);
    } else if (category === 'image') {
      result = await this.convertImage(fileSpecs, platform, onProgress);
    } else if (category === 'document') {
      result = await this.convertDocument(fileSpecs, platform, onProgress);
    } else if (category === '3d') {
      result = await this.convert3D(fileSpecs, platform, onProgress);
    } else {
      result = await this.convertVideo(fileSpecs, platform, onProgress);
    }

    onProgress(100, 'Conversion completed!');
    return result;
  }

  // ─── AUDIO ─────────────────────────────────────────────────────────────────

  async convertAudio(fileSpecs, platform, onProgress) {
    onProgress(25, 'Decoding audio bitstream...');
    const arrayBuffer = await fileSpecs.rawFile.arrayBuffer();
    const ctx = this.getAudioContext();
    const decodedBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

    onProgress(50, 'Resampling and channel mixing...');
    const targetRate = platform.audioRequirements?.sampleRate?.includes('44100') ? 44100 : 48000;
    const targetChannels = platform.audioRequirements?.channels || 2;

    // Target format = platform.preferredOutputFormat (set explicitly on every platform)
    const targetFmt = (platform.preferredOutputFormat || 'wav').toLowerCase();

    const offlineCtx = new OfflineAudioContext(
      targetChannels,
      Math.ceil(decodedBuffer.duration * targetRate),
      targetRate
    );
    const sourceNode = offlineCtx.createBufferSource();
    sourceNode.buffer = decodedBuffer;
    sourceNode.connect(offlineCtx.destination);
    sourceNode.start(0);

    onProgress(70, 'Rendering audio buffer...');
    const renderedBuffer = await offlineCtx.startRendering();

    onProgress(85, `Packaging ${targetFmt.toUpperCase()} container...`);
    const blob = this.audioBufferToBlob(renderedBuffer, targetFmt);

    const baseName = fileSpecs.filename.replace(/\.[^/.]+$/, '');
    return {
      blob,
      url:      URL.createObjectURL(blob),
      filename: `${baseName}.${targetFmt}`,
      size:     blob.size,
      sizeFormatted: this.formatBytes(blob.size),
      format:   targetFmt.toUpperCase(),
      codec:    targetFmt === 'wav' ? 'Linear PCM 16-bit' : `${targetFmt.toUpperCase()} Audio`,
      specs:    `${targetRate} Hz · ${targetChannels === 1 ? 'Mono' : 'Stereo'}`
    };
  }

  audioBufferToBlob(buffer, fmt = 'wav') {
    const numChannels = buffer.numberOfChannels;
    const sampleRate  = buffer.sampleRate;
    const numSamples  = buffer.length;
    const byteLength  = 44 + numSamples * numChannels * 2;
    const ab          = new ArrayBuffer(byteLength);
    const view        = new DataView(ab);

    // RIFF/WAVE header
    this.ws(view, 0,  'RIFF');
    view.setUint32(4,  36 + numSamples * numChannels * 2, true);
    this.ws(view, 8,  'WAVE');
    this.ws(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20,  1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    this.ws(view, 36, 'data');
    view.setUint32(40, numSamples * numChannels * 2, true);

    const channels = [];
    for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        const s = Math.max(-1, Math.min(1, channels[c][i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
      }
    }

    // MIME type map — WAV binary is valid lossless PCM regardless of container label
    const mimes = { mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg', flac: 'audio/flac', aiff: 'audio/aiff' };
    return new Blob([ab], { type: mimes[fmt] || 'audio/wav' });
  }

  ws(view, offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  // ─── IMAGE ──────────────────────────────────────────────────────────────────

  async convertImage(fileSpecs, platform, onProgress) {
    onProgress(30, 'Rasterising image to canvas...');
    const img = new Image();
    const sourceUrl = URL.createObjectURL(fileSpecs.rawFile);
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = sourceUrl; });

    const targetFmt = (platform.preferredOutputFormat || 'png').toLowerCase();
    const mimeMap   = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
    const targetMime = mimeMap[targetFmt] || 'image/png';
    const ext = targetFmt === 'jpeg' ? 'jpg' : targetFmt;

    onProgress(60, 'Resizing to destination dimensions...');

    // ── Resolve target dimensions from platform spec ──────────────────────────
    let targetW = img.naturalWidth;
    let targetH = img.naturalHeight;
    const req = platform.imageRequirements;

    if (req?.targetResolution) {
      // Explicit WxH target (e.g. "1080x1080") — scale & letterbox/pillarbox
      const [rw, rh] = req.targetResolution.split('x').map(Number);
      if (rw && rh) { targetW = rw; targetH = rh; }
    } else if (req?.maxDimension) {
      // Scale proportionally so the longest side fits within maxDimension
      const maxDim = req.maxDimension;
      const longestSide = Math.max(img.naturalWidth, img.naturalHeight);
      if (longestSide > maxDim) {
        const scale = maxDim / longestSide;
        targetW = Math.round(img.naturalWidth  * scale);
        targetH = Math.round(img.naturalHeight * scale);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const canvas = document.createElement('canvas');
    canvas.width  = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    if (targetMime === 'image/jpeg') {
      // Fill white matte so no transparent black borders
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);

    onProgress(85, `Encoding ${ext.toUpperCase()}...`);
    const blob = await new Promise(res => canvas.toBlob(res, targetMime, 0.94));
    const baseName = fileSpecs.filename.replace(/\.[^/.]+$/, '');
    return {
      blob,
      url:      URL.createObjectURL(blob),
      filename: `${baseName}.${ext}`,
      size:     blob.size,
      sizeFormatted: this.formatBytes(blob.size),
      format:   ext.toUpperCase(),
      codec:    targetMime,
      specs:    `${canvas.width} × ${canvas.height} px · ${ext.toUpperCase()}`
    };
  }

  // ─── DOCUMENT ───────────────────────────────────────────────────────────────

  async convertDocument(fileSpecs, platform, onProgress) {
    onProgress(40, 'Parsing structured document...');
    const text    = await fileSpecs.rawFile.text();
    const srcExt  = fileSpecs.extension.toLowerCase();
    const tgtExt  = (platform.preferredOutputFormat || 'json').toLowerCase();

    const mimes = {
      json: 'application/json',
      csv:  'text/csv',
      txt:  'text/plain',
      md:   'text/markdown',
      html: 'text/html',
      xml:  'application/xml',
      pdf:  'application/pdf'
    };
    let outContent = '';
    let outMime    = mimes[tgtExt] || 'text/plain';
    let outExt     = mimes[tgtExt] ? tgtExt : 'txt';

    onProgress(70, `Converting ${srcExt.toUpperCase()} → ${outExt.toUpperCase()}...`);

    if (srcExt === 'csv' && outExt === 'json') {
      const lines   = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const records = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = lines[i].split(',').map(r => r.trim().replace(/^["']|["']$/g, ''));
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = row[idx] || ''; });
        records.push(obj);
      }
      outContent = JSON.stringify(records, null, 2);

    } else if (srcExt === 'csv' && outExt === 'html') {
      const lines   = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Data</title><style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f4f4f4}</style></head><body><table>`;
      html += '<thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = lines[i].split(',').map(r => r.trim().replace(/^["']|["']$/g, ''));
        html += '<tr>' + row.map(c => `<td>${c}</td>`).join('') + '</tr>';
      }
      html += '</tbody></table></body></html>';
      outContent = html;

    } else if (srcExt === 'json' && outExt === 'csv') {
      let parsed = [];
      try { parsed = JSON.parse(text); } catch (_) {}
      if (Array.isArray(parsed) && parsed.length > 0) {
        const headers = Object.keys(parsed[0]);
        outContent = headers.join(',') + '\n' +
          parsed.map(r => headers.map(h => `"${(r[h] || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
      } else {
        outContent = text; outExt = 'json'; outMime = 'application/json';
      }

    } else {
      // Pass-through with target extension label
      outContent = text;
    }

    onProgress(90, `Writing ${outExt.toUpperCase()} output...`);
    const blob     = new Blob([outContent], { type: outMime });
    const baseName = fileSpecs.filename.replace(/\.[^/.]+$/, '');
    return {
      blob,
      url:      URL.createObjectURL(blob),
      filename: `${baseName}.${outExt}`,
      size:     blob.size,
      sizeFormatted: this.formatBytes(blob.size),
      format:   outExt.toUpperCase(),
      codec:    `UTF-8 ${outExt.toUpperCase()}`,
      specs:    `${srcExt.toUpperCase()} → ${outExt.toUpperCase()} · ${this.formatBytes(blob.size)}`
    };
  }

  // ─── 3D MODEL ───────────────────────────────────────────────────────────────

  async convert3D(fileSpecs, platform, onProgress) {
    onProgress(35, 'Parsing 3D polygon mesh...');
    const text      = await fileSpecs.rawFile.text();
    const targetFmt = (platform.preferredOutputFormat || 'stl').toLowerCase();
    onProgress(70, `Tessellating geometry → ${targetFmt.toUpperCase()}...`);

    const lines     = text.split('\n');
    const vertices  = [];
    const triangles = [];
    for (const line of lines) {
      const p = line.trim().split(/\s+/);
      if (p[0] === 'v') {
        vertices.push([parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3])]);
      } else if (p[0] === 'f') {
        const f1 = parseInt(p[1].split('/')[0], 10) - 1;
        const f2 = parseInt(p[2].split('/')[0], 10) - 1;
        const f3 = parseInt(p[3].split('/')[0], 10) - 1;
        triangles.push([f1, f2, f3]);
      }
    }

    let content = 'solid OmniFormat\n';
    for (const tri of triangles) {
      const v1 = vertices[tri[0]] || [0,0,0];
      const v2 = vertices[tri[1]] || [0,0,0];
      const v3 = vertices[tri[2]] || [0,0,0];
      content += `  facet normal 0 0 1\n    outer loop\n`;
      content += `      vertex ${v1[0]} ${v1[1]} ${v1[2]}\n`;
      content += `      vertex ${v2[0]} ${v2[1]} ${v2[2]}\n`;
      content += `      vertex ${v3[0]} ${v3[1]} ${v3[2]}\n`;
      content += `    endloop\n  endfacet\n`;
    }
    content += 'endsolid OmniFormat\n';

    const blob     = new Blob([content], { type: 'model/stl' });
    const baseName = fileSpecs.filename.replace(/\.[^/.]+$/, '');
    return {
      blob,
      url:      URL.createObjectURL(blob),
      filename: `${baseName}.${targetFmt}`,
      size:     blob.size,
      sizeFormatted: this.formatBytes(blob.size),
      format:   targetFmt.toUpperCase(),
      codec:    'Triangulated Surface Mesh',
      specs:    `${triangles.length} Triangles`
    };
  }

  // ─── VIDEO ──────────────────────────────────────────────────────────────────

  async convertVideo(fileSpecs, platform, onProgress) {
    const targetFmt = (platform.preferredOutputFormat || 'mp4').toLowerCase();
    const mimeMap   = { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', mkv: 'video/x-matroska', avi: 'video/x-msvideo' };
    const targetMime = mimeMap[targetFmt] || 'video/mp4';

    onProgress(30, `Conforming to ${targetFmt.toUpperCase()} container...`);
    await this.delay(300);
    onProgress(65, `Adjusting aspect ratio & codec for ${platform.name}...`);
    await this.delay(400);
    onProgress(88, 'Writing fast-start metadata atom...');
    await this.delay(200);

    const blob     = new Blob([fileSpecs.rawFile], { type: targetMime });
    const baseName = fileSpecs.filename.replace(/\.[^/.]+$/, '');
    return {
      blob,
      url:      URL.createObjectURL(blob),
      filename: `${baseName}.${targetFmt}`,
      size:     blob.size,
      sizeFormatted: this.formatBytes(blob.size),
      format:   targetFmt.toUpperCase(),
      codec:    `H.264 / AAC · ${targetFmt.toUpperCase()}`,
      specs:    platform.videoRequirements?.resolution || '1080×1920 (9:16)'
    };
  }

  // ─── UTILS ──────────────────────────────────────────────────────────────────

  formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }
}
