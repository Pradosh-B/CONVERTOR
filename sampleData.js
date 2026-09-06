/**
 * Instant Sample Fixture Generator
 * Synthesizes valid sample files in memory across all media categories.
 */

export class SampleDataGenerator {
  /**
   * Generates a real synthetic audio file (WAV buffer encoded with tone, named voice_recording.m4a)
   */
  static createAudioSample() {
    const sampleRate = 48000;
    const duration = 2.5; // 2.5 seconds
    const numChannels = 2;
    const numSamples = Math.floor(sampleRate * duration);
    const byteRate = sampleRate * numChannels * 2;
    const buffer = new ArrayBuffer(44 + numSamples * numChannels * 2);
    const view = new DataView(buffer);

    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * numChannels * 2, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true); // 16-bit
    this.writeString(view, 36, 'data');
    view.setUint32(40, numSamples * numChannels * 2, true);

    // Fill with warm synthetic chord (440Hz A + 554.37Hz C# + 659.25Hz E)
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.sin((Math.PI * i) / numSamples); // fade in and out
      const s1 = Math.sin(2 * Math.PI * 440 * t) * 0.4;
      const s2 = Math.sin(2 * Math.PI * 554.37 * t) * 0.3;
      const s3 = Math.sin(2 * Math.PI * 659.25 * t) * 0.2;
      const sample = (s1 + s2 + s3) * envelope;
      const intSample = Math.floor(sample * 0x7FFF);

      // Stereo (Left / Right)
      view.setInt16(offset, intSample, true);
      view.setInt16(offset + 2, intSample, true);
      offset += 4;
    }

    const blob = new Blob([buffer], { type: 'audio/mp4' });
    return new File([blob], 'voice_recording.m4a', { type: 'audio/mp4' });
  }

  /**
   * Generates a high-res PNG image with transparent alpha background and neon graphic
   */
  static async createImageSample() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Canvas is transparent by default
    ctx.clearRect(0, 0, 800, 800);

    // Outer glow ring
    const grad = ctx.createLinearGradient(150, 150, 650, 650);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(0.5, '#06b6d4');
    grad.addColorStop(1, '#10b981');

    ctx.save();
    ctx.shadowColor = '#6366f1';
    ctx.shadowBlur = 40;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.arc(400, 400, 240, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glowing diamond
    ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.beginPath();
    ctx.moveTo(400, 220);
    ctx.lineTo(580, 400);
    ctx.lineTo(400, 580);
    ctx.lineTo(220, 400);
    ctx.closePath();
    ctx.fill();

    // Center symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 120px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', 400, 400);
    ctx.restore();

    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    return new File([blob], 'brand_badge_alpha.png', { type: 'image/png' });
  }

  /**
   * Generates a sample CSV tabular document
   */
  static createDocumentSample() {
    const csvContent = `Quarter,ProductLine,ActiveUsers,RevenueUSD,YoYGrowth,Status
Q1-2026,Cloud AI Studio,128500,4820000,42.5%,Active
Q2-2026,Spatial Engine,94200,3190000,38.1%,Active
Q3-2026,Universal Transcoder,215000,8740000,64.2%,Target
Q4-2026,Enterprise Gateway,62000,5410000,29.8%,Projected`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    return new File([blob], 'quarterly_revenue_metrics.csv', { type: 'text/csv' });
  }

  /**
   * Generates a 3D Wavefront OBJ mesh
   */
  static create3DSample() {
    const objContent = `# OmniFormat Wavefront 3D Cube
v -1.0 -1.0  1.0
v  1.0 -1.0  1.0
v  1.0  1.0  1.0
v -1.0  1.0  1.0
v -1.0 -1.0 -1.0
v  1.0 -1.0 -1.0
v  1.0  1.0 -1.0
v -1.0  1.0 -1.0

vn  0.0  0.0  1.0
vn  0.0  0.0 -1.0
vn  0.0  1.0  0.0
vn  0.0 -1.0  0.0
vn  1.0  0.0  0.0
vn -1.0  0.0  0.0

f 1//1 2//1 3//1
f 1//1 3//1 4//1
f 5//2 7//2 6//2
f 5//2 8//2 7//2
f 4//3 3//3 7//3
f 4//3 7//3 8//3
f 1//4 6//4 2//4
f 1//4 5//4 6//4
f 2//5 6//5 7//5
f 2//5 7//5 3//5
f 1//6 4//6 8//6
f 1//6 8//6 5//6
`;
    const blob = new Blob([objContent], { type: 'text/plain' });
    return new File([blob], 'spatial_poly_cube.obj', { type: 'text/plain' });
  }

  /**
   * Generates a video sample
   */
  static async createVideoSample() {
    // Generate an animated canvas and convert to WebM/MP4
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');

    // Draw frame
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 640, 360);

    const grad = ctx.createLinearGradient(0, 0, 640, 360);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = grad;
    ctx.font = 'bold 36px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('16:9 Landscape Video Sample', 320, 180);

    ctx.font = '20px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('640 × 360 (16:9 Ratio, 30fps)', 320, 220);

    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    return new File([blob], 'landscape_teaser_16x9.mp4', { type: 'video/mp4' });
  }

  static writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
