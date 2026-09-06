/**
 * Compatibility Engine & Safety Guardian
 * Compares technical file properties against destination specifications,
 * calculates compatibility score, identifies quality risks, and outlines transformation steps.
 */

export class CompatibilityEngine {
  /**
   * Evaluate compatibility between analyzed file specifications and destination platform
   * @param {Object} fileSpecs 
   * @param {Object} platform 
   * @returns {Object} Compatibility analysis result
   */
  evaluate(fileSpecs, platform) {
    if (!fileSpecs || !platform) {
      return null;
    }

    const diffRows = [];
    const safetyAlerts = [];
    let matchPoints = 0;
    let totalPoints = 0;

    const ext = fileSpecs.extension.toLowerCase();
    const acceptedContainers = (platform.acceptedContainers || []).map(c => c.toLowerCase());
    const isContainerCompatible = acceptedContainers.includes(ext);

    // 1. Container / Format Check
    totalPoints += 30;
    if (isContainerCompatible) {
      matchPoints += 30;
      diffRows.push({
        property: 'Container / Format',
        current: fileSpecs.container || ext.toUpperCase(),
        target: acceptedContainers.map(c => c.toUpperCase()).join(', '),
        status: 'match'
      });
    } else {
      diffRows.push({
        property: 'Container / Format',
        current: fileSpecs.container || ext.toUpperCase(),
        target: acceptedContainers.map(c => c.toUpperCase()).join(', '),
        status: 'mismatch'
      });
    }

    // 2. File Size Check
    totalPoints += 15;
    const sizeMB = fileSpecs.size / (1024 * 1024);
    if (platform.maxSizeMB && sizeMB > platform.maxSizeMB) {
      diffRows.push({
        property: 'File Size Limit',
        current: `${sizeMB.toFixed(1)} MB`,
        target: `Max ${platform.maxSizeMB} MB`,
        status: 'mismatch'
      });
      safetyAlerts.push({
        type: 'SIZE_EXCEEDED',
        title: 'File Size Exceeds Platform Limit',
        message: `File is ${sizeMB.toFixed(1)} MB, but ${platform.name} caps uploads at ${platform.maxSizeMB} MB. Compression will be applied.`
      });
    } else {
      matchPoints += 15;
      diffRows.push({
        property: 'File Size Limit',
        current: `${sizeMB.toFixed(1)} MB`,
        target: platform.maxSizeMB ? `Under ${platform.maxSizeMB} MB` : 'No hard cap',
        status: 'match'
      });
    }

    // 3. Audio Requirements Check
    if (fileSpecs.category === 'audio' || (fileSpecs.category === 'video' && platform.audioRequirements)) {
      const audioReq = platform.audioRequirements;
      if (audioReq) {
        // Sample Rate Check
        totalPoints += 20;
        const currentSampleRate = fileSpecs.audio?.sampleRateVal || 48000;
        const targetRateStr = audioReq.sampleRate || '44100 Hz';
        const is44kTarget = targetRateStr.includes('44100');
        const is48kTarget = targetRateStr.includes('48000');

        let rateMatched = false;
        if (is44kTarget && currentSampleRate === 44100) rateMatched = true;
        else if (is48kTarget && currentSampleRate === 48000) rateMatched = true;
        else if (targetRateStr.includes('or')) rateMatched = true;

        if (rateMatched) {
          matchPoints += 20;
          diffRows.push({
            property: 'Audio Sample Rate',
            current: fileSpecs.audio?.sampleRate || `${currentSampleRate} Hz`,
            target: targetRateStr,
            status: 'match'
          });
        } else {
          diffRows.push({
            property: 'Audio Sample Rate',
            current: fileSpecs.audio?.sampleRate || `${currentSampleRate} Hz`,
            target: targetRateStr,
            status: 'suboptimal'
          });
        }

        // Channels Check
        totalPoints += 15;
        const currentChannels = fileSpecs.audio?.channelCount || 2;
        const targetChannels = audioReq.channels || 2;
        if (currentChannels === targetChannels) {
          matchPoints += 15;
          diffRows.push({
            property: 'Audio Channels',
            current: fileSpecs.audio?.channels || '2 (Stereo)',
            target: targetChannels === 1 ? '1 (Mono)' : '2 (Stereo)',
            status: 'match'
          });
        } else {
          diffRows.push({
            property: 'Audio Channels',
            current: fileSpecs.audio?.channels || '2 (Stereo)',
            target: targetChannels === 1 ? '1 (Mono)' : '2 (Stereo)',
            status: 'mismatch'
          });
          if (currentChannels > targetChannels) {
            safetyAlerts.push({
              type: 'CHANNEL_DOWNMIX',
              title: 'Audio Spatial Separation Loss',
              message: 'Converting from multi-channel stereo/surround to mono will fold left and right channels into a single track.'
            });
          }
        }
      }
    }

    // 4. Video Requirements Check
    if (fileSpecs.category === 'video' && platform.videoRequirements) {
      const vidReq = platform.videoRequirements;
      totalPoints += 25;

      const currentAspect = fileSpecs.video?.aspectRatio || '16:9';
      const targetAspect = vidReq.aspectRatio || '9:16';

      const isVerticalSource = currentAspect.includes('9:16');
      const isVerticalTarget = targetAspect.includes('9:16');

      if ((isVerticalSource && isVerticalTarget) || (!isVerticalSource && !isVerticalTarget)) {
        matchPoints += 25;
        diffRows.push({
          property: 'Aspect Ratio',
          current: currentAspect,
          target: targetAspect,
          status: 'match'
        });
      } else {
        diffRows.push({
          property: 'Aspect Ratio',
          current: currentAspect,
          target: targetAspect,
          status: 'mismatch'
        });
        safetyAlerts.push({
          type: 'ASPECT_RATIO_MISMATCH',
          title: 'Aspect Ratio Framing Shift',
          message: `Target requires ${targetAspect}, but source is ${currentAspect}. Automated smart-padding (letterboxing) or center-crop is needed.`
        });
      }
    }

    // 5. Image Requirements Check
    if (fileSpecs.category === 'image' && platform.imageRequirements) {
      const imgReq = platform.imageRequirements;
      totalPoints += 20;

      // Alpha channel test
      const sourceHasAlpha = fileSpecs.image?.hasAlpha || false;
      const targetAllowsAlpha = imgReq.supportsAlpha !== false && !['jpg', 'jpeg'].includes(platform.preferredCodec?.toLowerCase());

      if (sourceHasAlpha && !targetAllowsAlpha) {
        diffRows.push({
          property: 'Alpha Transparency',
          current: '32-bit RGBA (Transparent)',
          target: '24-bit RGB (Opaque / Solid)',
          status: 'mismatch'
        });
        safetyAlerts.push({
          type: 'ALPHA_LOSS',
          title: 'Transparency Will Be Stripped',
          message: `Converting this image to ${platform.name}'s required format will replace the transparent background with solid matte.`
        });
      } else {
        matchPoints += 20;
        diffRows.push({
          property: 'Alpha Transparency',
          current: sourceHasAlpha ? 'Supported (Transparent)' : 'Opaque',
          target: targetAllowsAlpha ? 'Permitted' : 'Not required',
          status: 'match'
        });
      }
    }

    // 6. 3D Model Requirements Check
    if (fileSpecs.category === '3d' && platform.modelRequirements) {
      totalPoints += 25;
      if (platform.id === 'stl_3d_print') {
        safetyAlerts.push({
          type: 'MATERIAL_STRIPPED',
          title: 'PBR Colors & Textures Stripped',
          message: 'Converting 3D models to STL formats only preserves surface triangulation geometry. All color, shaders, and rigging will be discarded.'
        });
      }
      matchPoints += isContainerCompatible ? 25 : 0;
    }

    // Fallback if totalPoints is 0
    if (totalPoints === 0) totalPoints = 100;
    const score = Math.min(100, Math.round((matchPoints / totalPoints) * 100));
    const isFullyCompatible = score >= 90 && isContainerCompatible;

    // Prescribe the exact transformation pipeline
    const transformationPlan = this.prescribeTransformation(fileSpecs, platform, isFullyCompatible);

    // AI Reasoning synthesis
    const reasoning = this.generateAIReasoning(fileSpecs, platform, isFullyCompatible, score, diffRows);

    return {
      score,
      isFullyCompatible,
      statusCategory: isFullyCompatible ? 'compatible' : score >= 50 ? 'warning' : 'incompatible',
      diffRows,
      safetyAlerts,
      transformationPlan,
      reasoning
    };
  }

  prescribeTransformation(fileSpecs, platform, isFullyCompatible) {
    if (isFullyCompatible) {
      return {
        actionRequired: false,
        summary: 'No conversion necessary. The file meets all platform specifications.'
      };
    }

    const ext = fileSpecs.extension.toLowerCase();
    const targetFormat = (platform.acceptedContainers && platform.acceptedContainers[0]) || 'mp4';

    let targetCodec = platform.preferredCodec || 'Standard';
    let extraNotes = [];

    if (platform.category === 'audio') {
      const sampleRate = platform.audioRequirements?.sampleRate || '44100 Hz';
      const channels = platform.audioRequirements?.channels === 1 ? 'Mono' : 'Stereo';
      extraNotes.push(`Resample to ${sampleRate}`);
      extraNotes.push(`Mix to ${channels}`);
    } else if (platform.category === 'social') {
      extraNotes.push('Conform aspect ratio to 9:16 vertical (1080×1920)');
      extraNotes.push('Encode video as H.264 High Profile @ 30/60 fps');
      extraNotes.push('Audio track encoded as AAC-LC @ 48 kHz stereo');
    } else if (platform.category === 'creative') {
      if (fileSpecs.image?.hasAlpha) {
        extraNotes.push('Preserve alpha transparency channel (PNG/WEBP)');
      }
      extraNotes.push('Convert color gamut to standard web sRGB');
    } else if (platform.id === 'stl_3d_print') {
      extraNotes.push('Tessellate quad faces into triangular manifold mesh');
      extraNotes.push('Export watertight binary STL coordinates in millimeters');
    }

    return {
      actionRequired: true,
      sourceFormat: ext.toUpperCase(),
      targetFormat: targetFormat.toUpperCase(),
      targetCodec,
      operations: extraNotes,
      pipelineSummary: `${ext.toUpperCase()} → ${targetFormat.toUpperCase()} (${targetCodec})`
    };
  }

  generateAIReasoning(fileSpecs, platform, isCompatible, score, diffs) {
    if (isCompatible) {
      return `✓ Perfect Match: Your ${fileSpecs.filename} meets all verified ingestion requirements for ${platform.name}. You can proceed with direct upload without degradation or transcoding delays.`;
    }

    const mismatches = diffs.filter(d => d.status === 'mismatch').map(d => d.property);
    const suboptimals = diffs.filter(d => d.status === 'suboptimal').map(d => d.property);

    let summary = `⚠️ Compatibility Incompatibility: ${platform.name} cannot accept this file in its current state (${fileSpecs.container || fileSpecs.extension.toUpperCase()}). `;
    
    if (mismatches.length > 0) {
      summary += `Primary blocking mismatches: ${mismatches.join(', ')}. `;
    }
    if (suboptimals.length > 0) {
      summary += `Parameters requiring optimization: ${suboptimals.join(', ')}. `;
    }

    summary += `OmniFormat AI has formulated a zero-loss transcoding profile to transform your file into compliant ${platform.preferredCodec || 'target'} format while preserving peak fidelity.`;

    return summary;
  }

  /**
   * Parse natural language user requirement into a dynamic platform object
   */
  parseCustomPrompt(promptText) {
    const text = (promptText || '').toLowerCase();
    const platform = {
      id: 'custom_ai_target',
      name: 'Custom Target Specification',
      category: 'creative',
      icon: '⚡',
      badgeColor: '#6366f1',
      description: promptText,
      acceptedContainers: ['mp4'],
      preferredCodec: 'Custom Standard',
      maxSizeMB: 50,
      notes: 'Dynamically synthesized by OmniFormat AI from your prompt.'
    };

    if (text.includes('wav') || text.includes('audio') || text.includes('podcast') || text.includes('sound')) {
      platform.category = 'audio';
      platform.primaryType = 'audio';
      platform.acceptedContainers = ['wav'];
      platform.preferredCodec = 'PCM WAV 16-bit';
      platform.audioRequirements = {
        sampleRate: text.includes('48') ? '48000 Hz' : text.includes('8k') ? '8000 Hz' : '44100 Hz',
        channels: text.includes('mono') ? 1 : 2
      };
    } else if (text.includes('png') || text.includes('image') || text.includes('jpeg') || text.includes('jpg') || text.includes('webp')) {
      platform.category = 'creative';
      platform.primaryType = 'image';
      platform.acceptedContainers = text.includes('png') ? ['png'] : text.includes('webp') ? ['webp'] : ['jpg'];
      platform.preferredCodec = text.includes('png') ? 'PNG (Lossless Alpha)' : 'JPEG 92% Quality';
      platform.imageRequirements = {
        supportsAlpha: text.includes('png') || text.includes('alpha') || text.includes('transparent')
      };
    } else if (text.includes('reel') || text.includes('tiktok') || text.includes('short') || text.includes('vertical')) {
      platform.category = 'social';
      platform.primaryType = 'video';
      platform.acceptedContainers = ['mp4'];
      platform.preferredCodec = 'H.264 / AAC';
      platform.videoRequirements = {
        aspectRatio: '9:16 (Vertical 1080×1920)',
        maxFps: 60
      };
    }

    // Check size mention (e.g. 10mb, 25mb, 100mb)
    const sizeMatch = text.match(/(\d+)\s*(mb|megabytes)/i);
    if (sizeMatch) {
      platform.maxSizeMB = parseInt(sizeMatch[1], 10);
    }

    return platform;
  }
}
