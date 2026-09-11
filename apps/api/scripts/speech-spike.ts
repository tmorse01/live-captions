/**
 * GCP Speech-to-Text streaming spike.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./sa.json pnpm speech-spike [path/to/test.wav]
 *
 * Without a WAV file, streams silence to validate stream lifecycle.
 */
import fs from 'node:fs';
import path from 'node:path';
import speech from '@google-cloud/speech';
import { loadMonorepoEnv } from '@live-captions/config';

const SAMPLE_RATE = 16000;
const ENCODING = 'LINEAR16' as const;

async function main() {
  const repoRoot = loadMonorepoEnv();
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credsPath) {
    console.error('GOOGLE_APPLICATION_CREDENTIALS is not set.');
    console.error('Add it to .env at the repo root (see .env.example).');
    process.exit(1);
  }

  if (!fs.existsSync(credsPath)) {
    console.error(`Credentials file not found: ${credsPath}`);
    console.error(`Repo root: ${repoRoot}`);
    process.exit(1);
  }

  console.log(`Using credentials: ${credsPath}`);

  const wavPath = process.argv[2];
  const client = new speech.SpeechClient();

  let firstInterimAt: number | null = null;
  let firstFinalAt: number | null = null;
  const startTime = Date.now();

  const recognizeStream = client.streamingRecognize({
    config: {
      encoding: ENCODING,
      sampleRateHertz: SAMPLE_RATE,
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
    },
    interimResults: true,
  });

  recognizeStream.on('data', (response) => {
    const result = response.results?.[0];
    if (!result?.alternatives?.[0]) return;

    const text = result.alternatives[0].transcript ?? '';
    const elapsed = Date.now() - startTime;

    if (result.isFinal) {
      if (firstFinalAt === null) firstFinalAt = elapsed;
      console.log(`[FINAL +${elapsed}ms] ${text}`);
    } else {
      if (firstInterimAt === null) firstInterimAt = elapsed;
      console.log(`[interim +${elapsed}ms] ${text}`);
    }
  });

  recognizeStream.on('error', (err) => {
    console.error('Stream error:', err.message);
    process.exit(1);
  });

  recognizeStream.on('end', () => {
    console.log('\n--- Spike Results ---');
    console.log(`First interim: ${firstInterimAt ?? 'none'} ms`);
    console.log(`First final:   ${firstFinalAt ?? 'none'} ms`);
    process.exit(0);
  });

  if (wavPath && fs.existsSync(wavPath)) {
    console.log(`Streaming WAV: ${path.resolve(wavPath)}`);
    const buffer = fs.readFileSync(wavPath);
    // Skip 44-byte WAV header for standard PCM WAV
    const pcm = buffer.subarray(44);
    const chunkSize = 3200; // 100ms at 16kHz mono 16-bit
    for (let offset = 0; offset < pcm.length; offset += chunkSize) {
      recognizeStream.write(pcm.subarray(offset, offset + chunkSize));
      await sleep(100);
    }
  } else {
    console.log('No WAV provided — streaming 3s of silence to validate stream lifecycle');
    const silence = Buffer.alloc(3200); // 100ms silence
    for (let i = 0; i < 30; i++) {
      recognizeStream.write(silence);
      await sleep(100);
    }
  }

  recognizeStream.end();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
