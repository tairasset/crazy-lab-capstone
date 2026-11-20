import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

// All model files are public. Pin both the revision and the exact bytes used for inference.
const source = 'https://huggingface.co/onnx-community/all-MiniLM-L12-v2-qa-all-ONNX/resolve/222ce933417187f06dd936952104aabfe889925c/';
const directory = new URL('./.guide-model/', import.meta.url);
const flan = 'https://huggingface.co/Xenova/flan-t5-small/resolve/311454e83bc784267fd7eef5940ee854144abbec/';
const files = [
  { source: flan, name: 'flan-encoder.onnx', path: 'onnx/encoder_model_quantized.onnx', size: 35759127, sha256: '968ce399b8dcdfd4c36833db51e9f78f327f7272ee9e2777fc2b3c8693208e90' },
  { source: flan, name: 'flan-decoder.onnx', path: 'onnx/decoder_model_quantized.onnx', size: 58943318, sha256: '7f090cbd1281a9c896a070b424ceb18df45da6e78d16895a14c72387708db216' },
  { source: flan, name: 'flan-tokenizer.json', path: 'tokenizer.json', size: 2422164, gitBlob: '188313c03c392a12933ea908d0a8b73b043236aa' },
  { source: flan, name: 'flan-config.json', path: 'tokenizer_config.json', size: 2349, gitBlob: 'e99a0d1df1d854da2da3e68e80a83ee379dff248' },
  { name: 'model.onnx', path: 'onnx/model_quantized.onnx', size: 34005635, sha256: '96dcabad9c2b36daa35cbca3677ae2dbfdbab1bc88eb921aeaafe12e1a322c9e' },
  { name: 'tokenizer.json', path: 'tokenizer.json', size: 711661, gitBlob: 'c17ed520ed8438736732a54957a69306b8822215' },
  { name: 'tokenizer_config.json', path: 'tokenizer_config.json', size: 1464, gitBlob: '6c45fb57d2f0685af994e00f74a0e1e3ef61d718' },
];

function verified(bytes, file) {
  if (bytes.length !== file.size) return false;
  if (file.sha256) return createHash('sha256').update(bytes).digest('hex') === file.sha256;
  return createHash('sha1').update('blob ' + file.size + '\0').update(bytes).digest('hex') === file.gitBlob;
}

await mkdir(directory, { recursive: true });
for (const file of files) {
  const destination = new URL(file.name, directory);
  const existing = await readFile(destination).catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (existing && verified(existing, file)) continue;
  const temporary = new URL(file.name + '.' + process.pid + '.tmp', directory);
  try {
    for (let attempt = 1; ; attempt++) {
      try {
        const response = await fetch((file.source ?? source) + file.path, { signal: AbortSignal.timeout(120_000) });
        if (!response.ok) throw new Error('Download returned HTTP ' + response.status);
        const bytes = Buffer.from(await response.arrayBuffer());
        if (!verified(bytes, file)) throw new Error('Integrity check failed for ' + file.name);
        await writeFile(temporary, bytes);
        await rename(temporary, destination);
        break;
      } catch (error) {
        if (attempt >= 3) throw error;
        await delay(attempt * 1500);
      }
    }
  } finally {
    await rm(temporary, { force: true });
  }
}
console.log('Verified MiniLM and FLAN-T5 weights and tokenizers.');
