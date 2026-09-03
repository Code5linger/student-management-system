import { put } from '@vercel/blob';

import {
  MAX_SUBMISSION_FILE_SIZE_BYTES,
  ALLOWED_SUBMISSION_MIME_TYPES,
} from './registry';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

export async function saveSubmissionFile(
  file: File,
): Promise<{ fileName: string; filePath: string }> {
  // TODO: I am trusting the filename extension + MIME type. But at this stage I wouldn't necessarily introduce a heavyweight malware-scanning pipeline.
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Only PDF or DOCX files are accepted.');
  }

  if (file.type && !ALLOWED_SUBMISSION_MIME_TYPES.includes(file.type)) {
    throw new Error('Only PDF or DOCX files are accepted.');
  }

  if (file.size > MAX_SUBMISSION_FILE_SIZE_BYTES) {
    // const maxMb = MAX_SUBMISSION_FILE_SIZE_BYTES / (1024 * 1024);

    throw new Error(`File is too large, the maximum is 10 MB.`);
  }

  if (file.size === 0) {
    throw new Error('That file appears to be empty.');
  }

  const storedName = `submissions/${crypto.randomUUID()}${ext}`;

  const blob = await put(storedName, file, {
    access: 'public',
  });

  return {
    fileName: file.name,
    filePath: blob.url,
  };
}
