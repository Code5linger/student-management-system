import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  MAX_SUBMISSION_FILE_SIZE_BYTES,
  ALLOWED_SUBMISSION_MIME_TYPES,
} from './registry';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

export async function saveSubmissionFile(
  file: File,
): Promise<{ fileName: string; filePath: string }> {
  // TODO: I am trusting the filename extension + MIME type. But at this stage I wouldn't necessarily introduce a heavyweight malware-scanning pipeline.
  const ext = path.extname(file.name).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Only PDF or DOCX files are accepted.');
  }

  if (file.type && !ALLOWED_SUBMISSION_MIME_TYPES.includes(file.type)) {
    throw new Error('Only PDF or DOCX files are accepted.');
  }

  if (file.size > MAX_SUBMISSION_FILE_SIZE_BYTES) {
    const maxMb = MAX_SUBMISSION_FILE_SIZE_BYTES / (1024 * 1024);
    throw new Error(`File is too large — the maximum is ${maxMb}MB.`);
  }
  if (file.size === 0) {
    throw new Error('That file appears to be empty.');
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const storedName = `${randomUUID()}${ext}`;
  const diskPath = path.join(UPLOAD_DIR, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buffer);

  return {
    fileName: file.name,
    filePath: `/uploads/${storedName}`,
  };
}
