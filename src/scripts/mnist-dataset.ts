// Browser-only MNIST IDX loader. The public Cloud Storage JSON API supports CORS.
// The full gzip IDX payloads are transferred once; samples are retained in memory only.
export interface MnistData {
  pixels: Float32Array;
  labels: Uint32Array;
}

const bucket = 'https://storage.googleapis.com/storage/v1/b/cvdf-datasets/o/';
const names = {
  train: ['train-images-idx3-ubyte.gz', 'train-labels-idx1-ubyte.gz'],
  test: ['t10k-images-idx3-ubyte.gz', 't10k-labels-idx1-ubyte.gz'],
} as const;

async function inflate(name: string, signal: AbortSignal): Promise<ArrayBuffer> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser does not support gzip DecompressionStream.');
  }
  const url = bucket + encodeURIComponent('mnist/' + name) + '?alt=media';
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('MNIST download failed (' + response.status + '): ' + name);
  const compressed = await response.arrayBuffer();
  const header = new Uint8Array(compressed);
  if (header[0] !== 0x1f || header[1] !== 0x8b) {
    throw new Error('MNIST data is not a gzip stream: ' + name);
  }
  return new Response(
    new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip')),
  ).arrayBuffer();
}

export async function fetchMnist(
  split: 'train' | 'test',
  limit: number,
  signal: AbortSignal,
): Promise<MnistData> {
  const [imageName, labelName] = names[split];
  const [imageBytes, labelBytes] = await Promise.all([
    inflate(imageName, signal),
    inflate(labelName, signal),
  ]);
  const iv = new DataView(imageBytes);
  const lv = new DataView(labelBytes);
  if (
    imageBytes.byteLength < 16 ||
    labelBytes.byteLength < 8 ||
    iv.getUint32(0) !== 2051 ||
    lv.getUint32(0) !== 2049
  ) throw new Error('Invalid MNIST IDX header');
  const rows = iv.getUint32(4);
  if (
    rows !== lv.getUint32(4) ||
    iv.getUint32(8) !== 28 ||
    iv.getUint32(12) !== 28 ||
    imageBytes.byteLength !== 16 + rows * 784 ||
    labelBytes.byteLength !== 8 + rows ||
    limit < 1 ||
    limit > rows
  ) throw new Error('Invalid MNIST IDX dimensions or payload');
  const input = new Uint8Array(imageBytes, 16, limit * 784);
  const sourceLabels = new Uint8Array(labelBytes, 8, limit);
  if (sourceLabels.some((v) => v > 9)) throw new Error('Invalid MNIST label');
  return {
    pixels: Float32Array.from(input, (value) => value / 255),
    labels: Uint32Array.from(sourceLabels),
  };
}
