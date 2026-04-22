export class WavRecorder {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.processor = null;
    this.source = null;
    this.recordedBuffers = [];
    this.recordingLength = 0;
    this.sampleRate = 16000; // Best for speech recognition models
  }

  async start() {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create AudioContext with explicit sampleRate
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    
    // Fallback if browser doesn't respect requested sampleRate
    this.sampleRate = this.audioContext.sampleRate;
    
    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    
    // createScriptProcessor is deprecated but widely supported and simplest for inline PCM capture.
    const bufferSize = 4096;
    this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    
    this.processor.onaudioprocess = (e) => {
      const channelData = e.inputBuffer.getChannelData(0);
      // Copy data so it doesn't get overwritten
      const buffer = new Float32Array(channelData);
      this.recordedBuffers.push(buffer);
      this.recordingLength += buffer.length;
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  async stop() {
    if (!this.processor) return null;
    
    this.processor.disconnect();
    this.source.disconnect();
    
    // Stop all tracks to release microphone
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
    }
    
    const wavBlob = this.exportWAV(this.recordedBuffers, this.recordingLength);
    
    // Cleanup
    this.recordedBuffers = [];
    this.recordingLength = 0;
    
    return wavBlob;
  }

  exportWAV(buffers, length) {
    const flatBuffer = new Float32Array(length);
    let offset = 0;
    for (let i = 0; i < buffers.length; i++) {
        flatBuffer.set(buffers[i], offset);
        offset += buffers[i].length;
    }

    // Convert to 16-bit PCM
    const buffer = new ArrayBuffer(44 + flatBuffer.length * 2);
    const view = new DataView(buffer);

    // RIFF chunk
    this._writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + flatBuffer.length * 2, true);
    this._writeString(view, 8, 'WAVE');
    
    // FMT chunk
    this._writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // 1 channel
    view.setUint32(24, this.sampleRate, true); 
    view.setUint32(28, this.sampleRate * 2, true); // byteRate
    view.setUint16(32, 2, true); // blockAlign
    view.setUint16(34, 16, true); // bitsPerSample = 16
    
    // DATA chunk
    this._writeString(view, 36, 'data');
    view.setUint32(40, flatBuffer.length * 2, true);
    
    // Write PCM samples
    let sampleVal;
    let viewOffset = 44;
    for (let i = 0; i < flatBuffer.length; i++) {
        sampleVal = flatBuffer[i];
        // Clip to [-1, 1]
        sampleVal = Math.max(-1, Math.min(1, sampleVal));
        // Scale to 16-bit int
        view.setInt16(viewOffset, sampleVal < 0 ? sampleVal * 0x8000 : sampleVal * 0x7FFF, true);
        viewOffset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  _writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
