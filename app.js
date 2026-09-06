/**
 * OmniFormat AI — Application Orchestrator & State Controller
 */

import { PLATFORMS_DB, PLATFORM_CATEGORIES, getPlatformById } from './platforms.js';
import { FileAnalyzer } from './analyzer.js';
import { CompatibilityEngine } from './compatibility.js';
import { ConversionEngine } from './converter.js';
import { SampleDataGenerator } from './sampleData.js';

class App {
  constructor() {
    this.analyzer = new FileAnalyzer();
    this.compatEngine = new CompatibilityEngine();
    this.converter = new ConversionEngine();

    this.state = {
      currentFileSpecs: null,
      selectedPlatform: null,
      categoryFilter: 'all',
      isConverting: false,
      lastConvertedResult: null
    };

    this.dom = {};
    this.init();
  }

  async init() {
    this.cacheDom();
    this.bindEvents();
    this.renderPlatformTabs();
    this.renderPlatformsList();

    // Select default platform: Pro Audio Master (WAV) to demonstrate mismatch with M4A
    this.state.selectedPlatform = getPlatformById('broadcast_wav') || PLATFORMS_DB[0];

    // Load initial sample file: voice_recording.m4a
    await this.loadSample('audio');
  }

  cacheDom() {
    this.dom = {
      dropzone: document.getElementById('main-dropzone'),
      fileInput: document.getElementById('file-input-element'),
      previewCard: document.getElementById('file-inspected-card'),
      previewTypeBadge: document.getElementById('preview-type-badge'),
      previewFilename: document.getElementById('preview-filename'),
      previewFilesize: document.getElementById('preview-filesize'),
      visualizerArea: document.getElementById('media-visualizer-area'),
      specsGrid: document.getElementById('specs-grid-display'),
      categoryTabs: document.getElementById('platform-category-tabs'),
      platformGrid: document.getElementById('platform-items-grid'),
      customTargetInput: document.getElementById('custom-target-input'),
      customTargetBtn: document.getElementById('custom-target-btn'),

      compatScoreBadge: document.getElementById('compat-score-badge'),
      compatBanner: document.getElementById('compat-status-banner'),
      compatIcon: document.getElementById('compat-status-icon'),
      compatTitle: document.getElementById('compat-status-title'),
      compatSubtitle: document.getElementById('compat-status-subtitle'),
      matrixTableBody: document.getElementById('matrix-table-body'),
      aiReasoningText: document.getElementById('ai-reasoning-text'),

      safetyAlertBox: document.getElementById('safety-alert-box'),
      safetyAlertTitle: document.getElementById('safety-alert-title'),
      safetyAlertMessage: document.getElementById('safety-alert-message'),

      btnConvert: document.getElementById('btn-execute-conversion'),
      btnConvertLabel: document.getElementById('btn-convert-label'),
      progressBox: document.getElementById('conversion-progress-box'),
      progressStageLabel: document.getElementById('progress-stage-label'),
      progressPercentLabel: document.getElementById('progress-percentage-label'),
      progressBarFill: document.getElementById('progress-bar-fill'),

      resultBox: document.getElementById('conversion-result-box'),
      resultFilename: document.getElementById('result-filename-text'),
      resultSpecs: document.getElementById('result-specs-text'),
      btnDownload: document.getElementById('btn-download-result'),
      btnHandoff: document.getElementById('btn-simulate-handoff'),
      toastContainer: document.getElementById('toast-container')
    };
  }

  bindEvents() {
    // Dropzone Drag and Drop
    const dropzone = this.dom.dropzone;
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-active');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-active');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        this.handleFileUpload(files[0]);
      }
    });

    // File input change
    this.dom.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleFileUpload(e.target.files[0]);
      }
    });

    // Sample Fixture Buttons
    const sampleBar = document.getElementById('sample-fixtures-bar');
    sampleBar.addEventListener('click', async (e) => {
      const btn = e.target.closest('.sample-pill-btn');
      if (!btn) return;

      document.querySelectorAll('.sample-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const sampleType = btn.dataset.type;
      await this.loadSample(sampleType);
    });

    // Custom AI target prompt
    this.dom.customTargetBtn.addEventListener('click', () => {
      this.handleCustomPrompt();
    });
    this.dom.customTargetInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleCustomPrompt();
    });

    // Convert Button
    this.dom.btnConvert.addEventListener('click', () => {
      this.executeConversion();
    });

    // Download Converted Result Button
    this.dom.btnDownload.addEventListener('click', () => {
      const result = this.state.lastConvertedResult;
      if (!result?.blob) {
        this.showToast('⚠️ No converted file ready. Please run conversion first.');
        return;
      }
      // Always create a fresh URL from the stored blob — avoids expired ObjectURL issues
      const freshUrl = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href     = freshUrl;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Clean up after browser has time to start the download
      setTimeout(() => URL.revokeObjectURL(freshUrl), 5000);
      this.showToast(`⬇️ Downloading ${result.filename}`);
    });

    // Simulate Handoff Button
    this.dom.btnHandoff.addEventListener('click', () => {
      const pName = this.state.selectedPlatform?.name || 'Platform';
      this.showToast(`✓ Injected into ${pName} workflow without manual upload step!`);
    });
  }

  async loadSample(type) {
    let file = null;
    let autoPlatformId = null;

    if (type === 'audio') {
      file = SampleDataGenerator.createAudioSample();
      autoPlatformId = 'broadcast_wav'; // forces M4A -> WAV transcode demonstration
    } else if (type === 'image') {
      file = await SampleDataGenerator.createImageSample();
      autoPlatformId = 'commercial_print'; // forces PNG (alpha) -> PDF/JPEG (no alpha) alert
    } else if (type === 'video') {
      file = await SampleDataGenerator.createVideoSample();
      autoPlatformId = 'instagram_reels'; // forces 16:9 -> 9:16 vertical reframe
    } else if (type === 'document') {
      file = SampleDataGenerator.createDocumentSample();
      autoPlatformId = 'slack_files';
    } else if (type === '3d') {
      file = SampleDataGenerator.create3DSample();
      autoPlatformId = 'stl_3d_print'; // forces OBJ -> STL mesh transcode
    }

    if (autoPlatformId) {
      this.state.selectedPlatform = getPlatformById(autoPlatformId);
    }

    await this.handleFileUpload(file);
  }

  async handleFileUpload(file) {
    this.resetConversionUI();
    this.showToast(`Analyzing ${file.name}...`);

    // Run deep analysis
    const specs = await this.analyzer.analyze(file);
    this.state.currentFileSpecs = specs;

    this.renderInspectedFile(specs);
    this.renderPlatformsList(); // refresh selection state
    this.updateCompatibility();
  }

  renderInspectedFile(specs) {
    // Type badge color and text
    const ext = specs.extension.toUpperCase();
    this.dom.previewTypeBadge.textContent = ext;
    this.dom.previewTypeBadge.className = `file-type-icon type-${specs.category}`;

    this.dom.previewFilename.textContent = specs.filename;
    this.dom.previewFilesize.textContent = `${specs.sizeFormatted} • ${specs.container} Container (${specs.mimeType})`;

    // Render visualizer
    this.renderVisualizer(specs);

    // Render specs grid chips
    const chips = [];
    chips.push({ label: 'Format', value: ext });
    chips.push({ label: 'MIME Type', value: specs.mimeType });
    chips.push({ label: 'Codec', value: specs.codec });

    if (specs.audio) {
      chips.push({ label: 'Sample Rate', value: specs.audio.sampleRate });
      chips.push({ label: 'Channels', value: specs.audio.channels });
      chips.push({ label: 'Bitrate', value: specs.audio.bitrate });
      chips.push({ label: 'Bit Depth', value: specs.audio.bitDepth });
    }

    if (specs.image) {
      chips.push({ label: 'Resolution', value: specs.image.resolution });
      chips.push({ label: 'Aspect Ratio', value: specs.image.aspectRatio });
      chips.push({ label: 'Alpha Channel', value: specs.image.hasAlpha ? '32-bit (Alpha)' : '24-bit (Opaque)' });
      chips.push({ label: 'Color Space', value: specs.image.colorSpace });
    }

    if (specs.video) {
      chips.push({ label: 'Resolution', value: specs.video.resolution });
      chips.push({ label: 'Aspect Ratio', value: specs.video.aspectRatio });
      chips.push({ label: 'Frame Rate', value: `${specs.video.fps} FPS` });
      chips.push({ label: 'Bitrate', value: specs.video.bitrate });
    }

    if (specs.document) {
      chips.push({ label: 'Structure', value: specs.document.type });
      chips.push({ label: 'Volume', value: specs.document.lineCount });
      chips.push({ label: 'Encoding', value: specs.document.encoding });
    }

    if (specs.model3D) {
      chips.push({ label: 'Geometry', value: specs.model3D.geometry });
      chips.push({ label: 'Normals', value: specs.model3D.normalsIncluded ? 'Included' : 'Missing' });
      chips.push({ label: 'Materials', value: specs.model3D.materials });
    }

    this.dom.specsGrid.innerHTML = chips.map(c => `
      <div class="spec-chip">
        <div class="spec-chip-label">${c.label}</div>
        <div class="spec-chip-value" title="${c.value}">${c.value}</div>
      </div>
    `).join('');
  }

  renderVisualizer(specs) {
    const box = this.dom.visualizerArea;
    box.innerHTML = '';

    if (specs.category === 'audio') {
      const canvas = document.createElement('canvas');
      canvas.className = 'waveform-canvas';
      canvas.width = 400;
      canvas.height = 60;
      box.appendChild(canvas);

      // Draw audio waveform
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 400, 60);

      const waveform = specs.audio?.waveform || [];
      const numBars = waveform.length || 40;
      const barWidth = 400 / numBars;

      const grad = ctx.createLinearGradient(0, 0, 400, 0);
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(0.5, '#06b6d4');
      grad.addColorStop(1, '#10b981');
      ctx.fillStyle = grad;

      for (let i = 0; i < numBars; i++) {
        const amp = waveform[i] !== undefined ? waveform[i] : Math.sin(i * 0.2) * 0.5 + 0.5;
        const barHeight = Math.max(4, amp * 52);
        const y = (60 - barHeight) / 2;
        ctx.fillRect(i * barWidth + 1, y, barWidth - 2, barHeight);
      }
    } else if (specs.category === 'image' && specs.previewUrl) {
      const img = document.createElement('img');
      img.src = specs.previewUrl;
      img.alt = 'Uploaded Image Preview';
      box.appendChild(img);
    } else if (specs.category === 'video' && specs.previewUrl) {
      const video = document.createElement('video');
      video.src = specs.previewUrl;
      video.controls = true;
      box.appendChild(video);
    } else if (specs.category === 'document') {
      const docPreview = document.createElement('div');
      docPreview.style.cssText = 'font-family: monospace; font-size: 0.75rem; color: #94a3b8; overflow: hidden; max-height: 80px; width: 100%;';
      docPreview.textContent = specs.rawSnippet || 'Structured document loaded';
      box.appendChild(docPreview);
    } else {
      const placeholder = document.createElement('div');
      placeholder.style.cssText = 'color: #64748b; font-size: 0.85rem;';
      placeholder.textContent = '3D Geometry Mesh Active (Watertight Manifold)';
      box.appendChild(placeholder);
    }
  }

  renderPlatformTabs() {
    this.dom.categoryTabs.innerHTML = PLATFORM_CATEGORIES.map(cat => `
      <button class="category-tab-btn ${cat.id === this.state.categoryFilter ? 'active' : ''}" data-cat="${cat.id}">
        ${cat.label}
      </button>
    `).join('');

    this.dom.categoryTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.category-tab-btn');
      if (!btn) return;
      this.state.categoryFilter = btn.dataset.cat;
      this.renderPlatformTabs();
      this.renderPlatformsList();
    });
  }

  renderPlatformsList() {
    const list = PLATFORMS_DB.filter(p => {
      if (this.state.categoryFilter === 'all') return true;
      return p.category === this.state.categoryFilter;
    });

    this.dom.platformGrid.innerHTML = list.map(p => {
      const isSelected = this.state.selectedPlatform?.id === p.id;
      return `
        <div class="platform-card ${isSelected ? 'selected' : ''}" data-platform-id="${p.id}">
          <div class="platform-card-icon" style="background: ${p.badgeColor}22; color: ${p.badgeColor}">
            ${p.icon}
          </div>
          <div class="platform-card-name">${p.name}</div>
          <div class="platform-card-category">${p.category.toUpperCase()}</div>
        </div>
      `;
    }).join('');

    this.dom.platformGrid.querySelectorAll('.platform-card').forEach(card => {
      card.addEventListener('click', () => {
        const pId = card.dataset.platformId;
        this.selectPlatform(pId);
      });
    });
  }

  selectPlatform(platformId) {
    const p = getPlatformById(platformId);
    if (!p) return;
    this.state.selectedPlatform = p;
    this.renderPlatformsList();
    this.updateCompatibility();
    this.showToast(`Selected destination: ${p.name}`);
  }

  handleCustomPrompt() {
    const text = this.dom.customTargetInput.value.trim();
    if (!text) return;

    const dynamicPlatform = this.compatEngine.parseCustomPrompt(text);
    PLATFORMS_DB.unshift(dynamicPlatform);
    this.state.selectedPlatform = dynamicPlatform;
    this.renderPlatformsList();
    this.updateCompatibility();
    this.showToast(`Synthesized custom destination profile from prompt!`);
  }

  updateCompatibility() {
    if (!this.state.currentFileSpecs || !this.state.selectedPlatform) return;

    const evalResult = this.compatEngine.evaluate(
      this.state.currentFileSpecs,
      this.state.selectedPlatform
    );

    // Update Score badge
    this.dom.compatScoreBadge.textContent = `${evalResult.score}% Compatible`;
    this.dom.compatScoreBadge.className = `badge ${evalResult.score >= 85 ? 'badge-privacy' : 'badge-ai'}`;

    // Update Banner
    this.dom.compatBanner.className = `compatibility-status-banner status-${evalResult.statusCategory}`;
    if (evalResult.isFullyCompatible) {
      this.dom.compatIcon.textContent = '✓';
      this.dom.compatTitle.textContent = '100% Compatible';
      this.dom.compatSubtitle.textContent = `Your file is already directly compliant with ${this.state.selectedPlatform.name}. No conversion needed.`;
      this.dom.btnConvertLabel.textContent = 'File Is Already Compatible (Direct Upload)';
      this.dom.btnConvert.disabled = false;
    } else {
      this.dom.compatIcon.textContent = evalResult.score >= 50 ? '⚠️' : '✕';
      this.dom.compatTitle.textContent = evalResult.score >= 50 ? 'Optimization Recommended' : 'Direct Upload Incompatible';
      this.dom.compatSubtitle.textContent = `Destination expects ${this.state.selectedPlatform.preferredCodec || 'target'} format.`;
      this.dom.btnConvertLabel.textContent = `Convert & Make Compatible with ${this.state.selectedPlatform.name}`;
      this.dom.btnConvert.disabled = false;
    }

    // Render Diff Table
    this.dom.matrixTableBody.innerHTML = evalResult.diffRows.map(row => {
      const badgeClass = row.status === 'match' ? 'prop-match' : row.status === 'mismatch' ? 'prop-mismatch' : 'prop-suboptimal';
      const badgeIcon = row.status === 'match' ? '✓' : row.status === 'mismatch' ? '✕' : '▲';
      return `
        <tr>
          <td class="prop-name">${row.property}</td>
          <td class="prop-val-current">${row.current}</td>
          <td class="prop-val-target">${row.target}</td>
          <td><span class="prop-badge ${badgeClass}">${badgeIcon} ${row.status.toUpperCase()}</span></td>
        </tr>
      `;
    }).join('');

    // AI Reasoning
    this.dom.aiReasoningText.textContent = evalResult.reasoning;

    // Safety Alert Box
    if (evalResult.safetyAlerts.length > 0) {
      const firstAlert = evalResult.safetyAlerts[0];
      this.dom.safetyAlertBox.style.display = 'flex';
      this.dom.safetyAlertTitle.textContent = firstAlert.title;
      this.dom.safetyAlertMessage.textContent = firstAlert.message;
    } else {
      this.dom.safetyAlertBox.style.display = 'none';
    }
  }

  async executeConversion() {
    if (this.state.isConverting) return;
    this.state.isConverting = true;

    this.dom.btnConvert.disabled = true;
    this.dom.progressBox.style.display = 'flex';
    this.dom.resultBox.style.display = 'none';

    try {
      const result = await this.converter.convert(
        this.state.currentFileSpecs,
        this.state.selectedPlatform,
        (percent, statusText) => {
          this.dom.progressBarFill.style.width = `${percent}%`;
          this.dom.progressPercentLabel.textContent = `${percent}%`;
          this.dom.progressStageLabel.innerHTML = `<span class="badge-dot"></span> ${statusText}`;
        }
      );

      this.state.lastConvertedResult = result;
      this.dom.progressBox.style.display = 'none';
      this.dom.resultBox.style.display = 'flex';

      this.dom.resultFilename.textContent = result.filename;
      this.dom.resultSpecs.textContent = `${result.sizeFormatted} • ${result.specs} • Converted 100% locally`;

      this.showToast(`✓ Converted to ${result.filename}!`);
    } catch (err) {
      console.error('Conversion failed:', err);
      this.dom.progressBox.style.display = 'none';
      this.showToast(`Transcoding failed: ${err.message || err}`);
    } finally {
      this.state.isConverting = false;
      this.dom.btnConvert.disabled = false;
    }
  }

  resetConversionUI() {
    this.dom.progressBox.style.display = 'none';
    this.dom.resultBox.style.display = 'none';
    this.dom.progressBarFill.style.width = '0%';
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;

    this.dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
}

// Bootstrap on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
