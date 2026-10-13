export async function remuxToMp4(recording: Blob): Promise<Blob> {
  const { ALL_FORMATS, BlobSource, BufferTarget, Conversion, Input, Mp4OutputFormat, Output } = await import('mediabunny');
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(recording) });
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
  const conversion = await Conversion.init({ input, output });
  if (!conversion.isValid) throw new Error('Recording cannot be rewritten as MP4');
  await conversion.execute();
  const buffer = output.target.buffer;
  if (!buffer || buffer.byteLength === 0) throw new Error('Rewritten MP4 is empty');
  return new Blob([buffer], { type: 'video/mp4' });
}
