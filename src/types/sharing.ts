export type ShareMedia =
  | { key: string; status: 'working' }
  | { key: string; status: 'ready'; blob: Blob; url: string }
  | { key: string; status: 'error' };
