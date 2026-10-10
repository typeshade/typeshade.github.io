// Client controller for the live MNIST learning lab.
// Data parsing, batch scheduling and drawing are browser JS; training kernels and
// prediction logits are produced exclusively by the packed TypeShade program.
import type { Pack } from '../../vendor/shader-dsl/src/core/manifest-types.ts';
import { fetchMnist, type MnistData } from './mnist-dataset.ts';
import { openMnistEngine, type MnistEngine } from './mnist-engine.ts';
import type { Copy } from '../i18n/index.ts';

type Words = Copy['mnist']['demo'];
type Tier = 'webgpu' | 'webgl2';
const inputs = 784;
const size = 28;
const batchSize = 16;

function required<T extends Element>(root: Element, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error('MNIST UI element missing: ' + selector);
  return el;
}

function createPixels(image: Uint8ClampedArray): Float32Array {
  const pixels = new Float32Array(inputs);
  for (let i = 0; i < inputs; i++) pixels[i] = image[i * 4] / 255;
  return pixels;
}

function softmax(logits: Float32Array): number[] {
  const values = Array.from(logits.subarray(0, 10));
  const max = Math.max(...values);
  const exps = values.map((x) => Math.exp(x - max));
  const total = exps.reduce((sum, x) => sum + x, 0);
  return exps.map((x) => x / total);
}

export function mountMnist(root: HTMLElement): void {
  const packElement = required<HTMLScriptElement>(root, '[data-pack]');
  const pack = JSON.parse(packElement.textContent || 'null') as Pack;
  if (!pack?.entries?.length) throw new Error('TypeShade MNIST manifest not found');
  const words = JSON.parse(root.dataset.copy || 'null') as Words;
  const start = required<HTMLButtonElement>(root, '[data-start]');
  const cancel = required<HTMLButtonElement>(root, '[data-cancel]');
  const clear = required<HTMLButtonElement>(root, '[data-clear]');
  const sample = required<HTMLButtonElement>(root, '[data-sample]');
  const backend = required<HTMLSelectElement>(root, '[data-tier]');
  const countSelect = required<HTMLSelectElement>(root, '[data-count]');
  const epochsSelect = required<HTMLSelectElement>(root, '[data-epochs]');
  const status = required<HTMLElement>(root, '[data-status]');
  const progress = required<HTMLProgressElement>(root, '[data-progress]');
  const results = required<HTMLElement>(root, '[data-results]');
  const probabilities = required<HTMLElement>(root, '[data-probabilities]');
  const guess = required<HTMLElement>(root, '[data-guess]');
  const groundTruth = required<HTMLElement>(root, '[data-ground-truth]');
  const canvas = required<HTMLCanvasElement>(root, '[data-draw]');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('MNIST drawing canvas unavailable');
  let engine: MnistEngine | undefined;
  let signalController: AbortController | undefined;
  let testing: MnistData | undefined;
  let currentSample = -1;
  let busy = false;
  let drawing = false;
  let predictionSequence = 0;
  let processedPixels: Float32Array = new Float32Array(inputs);

  const setStatus = (message: string) => {
    status.textContent = message;
  };
  const buttons = () => {
    start.disabled = busy;
    cancel.disabled = !busy;
    sample.disabled = busy || !testing || !engine;
    clear.disabled = busy;
    backend.disabled = busy;
    countSelect.disabled = busy;
    epochsSelect.disabled = busy;
  };
  const resetCanvas = () => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 19;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    processedPixels.fill(0);
    currentSample = -1;
    groundTruth.textContent = '';
    guess.textContent = '';
    probabilities.replaceChildren();
  };
  resetCanvas();
  buttons();

  const point = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    };
  };
  const digitPixels = (): Float32Array => {
    const small = document.createElement('canvas');
    small.width = small.height = size;
    const smallContext = small.getContext('2d', { willReadFrequently: true });
    if (!smallContext) throw new Error('Cannot normalize handwritten digit');
    // Fit the written mark into a 20px box; MNIST digits are approximately
    // size-normalized inside their 28x28 frames.
    const source = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let left = canvas.width,
      top = canvas.height,
      right = -1,
      bottom = -1;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (source.data[(y * canvas.width + x) * 4] < 30) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
    if (right < left) return new Float32Array(inputs);
    const width = right - left + 1,
      height = bottom - top + 1;
    const factor = 20 / Math.max(width, height);
    const fittedWidth = Math.max(1, Math.round(width * factor));
    const fittedHeight = Math.max(1, Math.round(height * factor));
    smallContext.fillStyle = '#000';
    smallContext.fillRect(0, 0, size, size);
    smallContext.drawImage(
      canvas,
      left,
      top,
      width,
      height,
      (size - fittedWidth) / 2,
      (size - fittedHeight) / 2,
      fittedWidth,
      fittedHeight,
    );
    return createPixels(smallContext.getImageData(0, 0, size, size).data);
  };
  const showBars = (values: number[]) => {
    probabilities.replaceChildren();
    for (let i = 0; i < 10; i++) {
      const row = document.createElement('li');
      const digit = document.createElement('span');
      digit.textContent = String(i);
      const bar = document.createElement('meter');
      bar.min = 0;
      bar.max = 1;
      bar.value = values[i];
      bar.setAttribute('aria-label', String(i));
      const percent = document.createElement('span');
      percent.textContent = (values[i] * 100).toFixed(1) + '%';
      row.append(digit, bar, percent);
      probabilities.append(row);
    }
  };
  const predict = async (pixels: Float32Array) => {
    if (!engine || busy) return;
    const current = ++predictionSequence;
    if (!pixels.some((value) => value > 0.01)) {
      guess.textContent = words.drawFirst;
      probabilities.replaceChildren();
      return;
    }
    try {
      engine.setBatch(pixels, new Uint32Array([0]));
      await engine.dispatch('forward', 1, 0);
      const logits = (await engine.read('logits')) as Float32Array;
      if (current !== predictionSequence) return;
      const values = softmax(logits);
      const answer = values.indexOf(Math.max(...values));
      guess.textContent =
        words.prediction + ' ' + answer + ' (' + (values[answer] * 100).toFixed(1) + '%)';
      showBars(values);
    } catch (error) {
      setStatus(words.error + ': ' + String(error));
    }
  };
  canvas.addEventListener('pointerdown', (event) => {
    if (busy) return;
    canvas.setPointerCapture(event.pointerId);
    drawing = true;
    currentSample = -1;
    groundTruth.textContent = '';
    const p = point(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.01, p.y + 0.01);
    ctx.stroke();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drawing || busy) return;
    const p = point(event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  });
  const finish = () => {
    if (!drawing) return;
    drawing = false;
    processedPixels = digitPixels();
    void predict(processedPixels);
  };
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
  clear.addEventListener('click', () => {
    predictionSequence++;
    resetCanvas();
    setStatus(engine ? words.drawPrompt : words.idle);
  });
  sample.addEventListener('click', () => {
    if (!testing || !engine || busy) return;
    currentSample = (currentSample + 1) % testing.labels.length;
    const image = testing.pixels.subarray(currentSample * inputs, (currentSample + 1) * inputs);
    const small = document.createElement('canvas');
    small.width = small.height = 28;
    const smallContext = small.getContext('2d');
    if (!smallContext) return;
    const data = smallContext.createImageData(size, size);
    for (let i = 0; i < inputs; i++) {
      const value = Math.round(image[i] * 255);
      data.data[i * 4] = value;
      data.data[i * 4 + 1] = value;
      data.data[i * 4 + 2] = value;
      data.data[i * 4 + 3] = 255;
    }
    smallContext.putImageData(data, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    groundTruth.textContent = words.actualLabel + ' ' + testing.labels[currentSample];
    processedPixels = image.slice();
    void predict(processedPixels);
  });
  const checkAbort = (signal: AbortSignal) => {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  };
  const evaluate = async (data: MnistData, signal: AbortSignal) => {
    if (!engine) throw new Error('Missing MNIST backend');
    let loss = 0,
      correct = 0;
    for (let offset = 0; offset < data.labels.length; offset += batchSize) {
      checkAbort(signal);
      const count = Math.min(batchSize, data.labels.length - offset);
      engine.setBatch(
        data.pixels.subarray(offset * inputs, (offset + count) * inputs),
        data.labels.subarray(offset, offset + count),
      );
      await engine.dispatch('forward', count, 0);
      await engine.dispatch('objective', count, 0);
      await engine.dispatch('reduce', count, 0);
      const stats = (await engine.read('stats')) as Float32Array;
      loss += stats[0] * count;
      correct += stats[1];
    }
    return { loss: loss / data.labels.length, accuracy: correct / data.labels.length };
  };
  cancel.addEventListener('click', () => signalController?.abort());
  start.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    buttons();
    predictionSequence++;
    engine?.destroy();
    engine = undefined;
    testing = undefined;
    signalController?.abort();
    signalController = new AbortController();
    const signal = signalController.signal;
    const samples = Number(countSelect.value);
    const epochs = Number(epochsSelect.value);
    progress.value = 0;
    progress.max = samples * epochs;
    results.replaceChildren();
    groundTruth.textContent = '';
    guess.textContent = '';
    probabilities.replaceChildren();
    const started = performance.now();
    try {
      setStatus(words.downloading);
      const trainData = await fetchMnist('train', samples, signal);
      const testData = await fetchMnist('test', 64, signal);
      checkAbort(signal);
      setStatus(words.compiling);
      const requested = backend.value;
      const choices: Tier[] = requested === 'auto' ? ['webgpu', 'webgl2'] : [requested as Tier];
      let lastError: unknown;
      for (const choice of choices) {
        try {
          engine = await openMnistEngine(pack, batchSize, choice);
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!engine) throw lastError ?? new Error('No TypeShade GPU backend available');
      testing = testData;
      setStatus(words.running + ': ' + engine.tier + ' / ' + engine.renderer);
      for (let epoch = 1; epoch <= epochs; epoch++) {
        for (let offset = 0; offset < samples; offset += batchSize) {
          checkAbort(signal);
          const count = Math.min(batchSize, samples - offset);
          engine.setBatch(
            trainData.pixels.subarray(offset * inputs, (offset + count) * inputs),
            trainData.labels.subarray(offset, offset + count),
          );
          await engine.dispatch('forward', count, 0.1);
          await engine.dispatch('objective', count, 0.1);
          await engine.dispatch('backward', count, 0.1);
          await engine.dispatch('update', count, 0.1);
          progress.value = (epoch - 1) * samples + offset + count;
          if (offset % (batchSize * 4) === 0) {
            setStatus(
              words.running + ': ' + engine.tier + ', ' + words.epoch + ' ' + epoch + '/' + epochs,
            );
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          }
        }
        const metrics = await evaluate(testData, signal);
        const entry = document.createElement('li');
        entry.textContent =
          words.epoch +
          ' ' +
          epoch +
          '/' +
          epochs +
          ': ' +
          words.testAccuracy +
          ' ' +
          (metrics.accuracy * 100).toFixed(1) +
          '%, ' +
          words.loss +
          ' ' +
          metrics.loss.toFixed(3);
        results.append(entry);
      }
      checkAbort(signal);
      setStatus(
        words.completed +
          ': ' +
          engine.tier +
          ', ' +
          ((performance.now() - started) / 1000).toFixed(1) +
          's',
      );
      currentSample = -1;
      busy = false;
      buttons();
      sample.click();
    } catch (error) {
      engine?.destroy();
      engine = undefined;
      testing = undefined;
      setStatus(signal.aborted ? words.cancelled : words.error + ': ' + String(error));
    } finally {
      busy = false;
      buttons();
    }
  });
  addEventListener(
    'pagehide',
    () => {
      signalController?.abort();
      engine?.destroy();
    },
    { once: true },
  );
}
