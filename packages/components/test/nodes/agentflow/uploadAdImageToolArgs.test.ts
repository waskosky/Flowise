import { getFileFromStorage } from '../../../src/storageUtils'
import { injectUploadAdImageToolArgs } from '../../../nodes/agentflow/uploadAdImageToolArgs'

jest.mock('../../../src/storageUtils', () => ({
    getFileFromStorage: jest.fn()
}))

describe('injectUploadAdImageToolArgs', () => {
    const mockedGetFileFromStorage = getFileFromStorage as jest.MockedFunction<typeof getFileFromStorage>

    beforeEach(() => {
        mockedGetFileFromStorage.mockReset()
    })

    it('injects a stored chat image as a data url for upload_ad_image', async () => {
        mockedGetFileFromStorage.mockResolvedValue(Buffer.from('poster-binary'))

        const result = await injectUploadAdImageToolArgs({
            toolName: 'upload_ad_image',
            toolArgs: {
                account_id: 'act_123'
            },
            uploads: [
                {
                    type: 'stored-file',
                    name: 'poster.png',
                    mime: 'image/png'
                }
            ],
            orgId: 'org-1',
            chatflowId: 'chatflow-1',
            chatId: 'chat-1'
        })

        expect(result).toEqual({
            account_id: 'act_123',
            file: 'data:image/png;base64,cG9zdGVyLWJpbmFyeQ==',
            name: 'poster.png'
        })
        expect(mockedGetFileFromStorage).toHaveBeenCalledWith('poster.png', 'org-1', 'chatflow-1', 'chat-1')
    })

    it('does not override an explicit file argument', async () => {
        const result = await injectUploadAdImageToolArgs({
            toolName: 'upload_ad_image',
            toolArgs: {
                account_id: 'act_123',
                file: 'data:image/jpeg;base64,abc'
            },
            uploads: [
                {
                    type: 'stored-file',
                    name: 'poster.jpg',
                    mime: 'image/jpeg'
                }
            ],
            orgId: 'org-1',
            chatflowId: 'chatflow-1',
            chatId: 'chat-1'
        })

        expect(result).toEqual({
            account_id: 'act_123',
            file: 'data:image/jpeg;base64,abc'
        })
        expect(mockedGetFileFromStorage).not.toHaveBeenCalled()
    })

    it('does not override an explicit image_url argument', async () => {
        const result = await injectUploadAdImageToolArgs({
            toolName: 'upload_ad_image',
            toolArgs: {
                account_id: 'act_123',
                image_url: 'https://example.com/poster.png'
            },
            uploads: [
                {
                    type: 'stored-file',
                    name: 'poster.png',
                    mime: 'image/png'
                }
            ],
            orgId: 'org-1',
            chatflowId: 'chatflow-1',
            chatId: 'chat-1'
        })

        expect(result).toEqual({
            account_id: 'act_123',
            image_url: 'https://example.com/poster.png'
        })
        expect(mockedGetFileFromStorage).not.toHaveBeenCalled()
    })

    it('ignores non-image uploads and other tool names', async () => {
        const result = await injectUploadAdImageToolArgs({
            toolName: 'create_ad',
            toolArgs: {
                account_id: 'act_123'
            },
            uploads: [
                {
                    type: 'stored-file',
                    name: 'brief.pdf',
                    mime: 'application/pdf'
                }
            ],
            orgId: 'org-1',
            chatflowId: 'chatflow-1',
            chatId: 'chat-1'
        })

        expect(result).toEqual({
            account_id: 'act_123'
        })
        expect(mockedGetFileFromStorage).not.toHaveBeenCalled()
    })
})
