import * as path from 'path'

const CSV_MIME_ALIASES = new Set(['application/vnd.ms-excel', 'application/csv', 'application/x-csv', 'text/x-csv'])

export const normalizeAttachmentUploadMimeType = (filename: string, mimetype: string): string => {
    const trimmedMimeType = typeof mimetype === 'string' ? mimetype.trim() : ''
    if (!trimmedMimeType) return trimmedMimeType

    const normalizedExt = path.extname(typeof filename === 'string' ? filename : '').toLowerCase()
    if (normalizedExt === '.csv' && CSV_MIME_ALIASES.has(trimmedMimeType.toLowerCase())) {
        return 'text/csv'
    }

    return trimmedMimeType
}
