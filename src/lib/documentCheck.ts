export const documentTypes = ['application/pdf', 'image/jpeg', 'image/png']
export const documentLimit = 2 * 1024 * 1024

export function checkDocument(
  file: Pick<File, 'size' | 'type'> | null,
): string | null {
  if (!file || file.size === 0) return 'Choose a file to upload.'
  if (file.size > documentLimit) return 'That file is too big. The limit is 2 MB.'
  if (!documentTypes.includes(file.type)) return 'Choose a PDF, JPEG or PNG file.'
  return null
}