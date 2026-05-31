export const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  let channels = [], i, sample;
  let offset = 0, pos = 0;

  const setUint16 = (data: number) => {
    view.setUint16(offset, data, true);
    offset += 2;
  };

  const setUint32 = (data: number) => {
    view.setUint32(offset, data, true);
    offset += 4;
  };

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < buffer.length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale
      view.setInt16(offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([bufferArray], { type: 'audio/wav' });
};

export const trimAudio = async (
  file: File,
  startTime: number,
  endTime: number,
  onProgress: (p: number) => void
): Promise<string> => {
   const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
   const ctx = new AudioContextClass();

   onProgress(10);
   const arrayBuffer = await file.arrayBuffer();
   
   onProgress(30);
   const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
   
   onProgress(50);
   const startOffset = Math.max(0, startTime);
   const endOffset = Math.min(audioBuffer.duration, endTime);
   const duration = endOffset - startOffset;

   if (duration <= 0) throw new Error('কাটার জন্য সঠিক সময় নির্বাচন করুন।');

   const offlineCtx = new OfflineAudioContext(
     audioBuffer.numberOfChannels,
     Math.ceil(duration * audioBuffer.sampleRate),
     audioBuffer.sampleRate
   );
   
   const source = offlineCtx.createBufferSource();
   source.buffer = audioBuffer;
   source.connect(offlineCtx.destination);
   
   source.start(0, startOffset, duration);
   
   onProgress(70);
   const renderedBuffer = await offlineCtx.startRendering();
   
   onProgress(85);
   const wavBlob = await new Promise<Blob>((resolve, reject) => {
     setTimeout(() => {
        try {
           resolve(audioBufferToWav(renderedBuffer));
        } catch (e) {
           reject(e);
        }
     }, 100);
   });

   onProgress(100);
   return URL.createObjectURL(wavBlob);
};
