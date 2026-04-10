describe('normalizeAttachmentUploadMimeType', () => {
    it('normalizes csv files uploaded with spreadsheet mime aliases to text/csv', () => {
        let normalizeAttachmentUploadMimeType: ((filename: string, mimetype: string) => string) | undefined

        try {
            normalizeAttachmentUploadMimeType = require('../../src/utils/uploadMimeType').normalizeAttachmentUploadMimeType
        } catch (error) {
            normalizeAttachmentUploadMimeType = undefined
        }

        expect(normalizeAttachmentUploadMimeType?.('audience.csv', 'application/vnd.ms-excel')).toBe('text/csv')
    })
})
