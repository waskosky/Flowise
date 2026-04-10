import { ICommonObject, IFileUpload } from '../../src/Interface'
import { getFileFromStorage } from '../../src/storageUtils'

type InjectUploadAdImageToolArgsParams = {
    toolName?: string
    toolArgs?: ICommonObject
    uploads?: IFileUpload[]
    orgId?: string
    chatflowId?: string
    chatId?: string
}

const getLatestImageUpload = (uploads: IFileUpload[] = []): IFileUpload | undefined => {
    const imageUploads = uploads.filter((upload) => upload.mime?.startsWith('image/'))
    return imageUploads[imageUploads.length - 1]
}

const normalizeFileName = (fileName: string): string => {
    return fileName.replace(/^FILE-STORAGE::/, '')
}

export const injectUploadAdImageToolArgs = async ({
    toolName,
    toolArgs,
    uploads,
    orgId,
    chatflowId,
    chatId
}: InjectUploadAdImageToolArgsParams): Promise<ICommonObject> => {
    const normalizedToolArgs = toolArgs ?? {}

    if (toolName !== 'upload_ad_image') {
        return normalizedToolArgs
    }

    if (normalizedToolArgs.file || normalizedToolArgs.image_url) {
        return normalizedToolArgs
    }

    const latestImageUpload = getLatestImageUpload(uploads)
    if (!latestImageUpload) {
        return normalizedToolArgs
    }

    const nextToolArgs: ICommonObject = { ...normalizedToolArgs }
    if (!nextToolArgs.name && latestImageUpload.name) {
        nextToolArgs.name = normalizeFileName(latestImageUpload.name)
    }

    if (latestImageUpload.type === 'url' && latestImageUpload.data) {
        nextToolArgs.image_url = latestImageUpload.data
        return nextToolArgs
    }

    if (latestImageUpload.data) {
        nextToolArgs.file = latestImageUpload.data
        return nextToolArgs
    }

    if (latestImageUpload.type !== 'stored-file') {
        return normalizedToolArgs
    }

    if (!orgId || !chatflowId || !chatId) {
        throw new Error('Unable to inject uploaded chat image: missing chat storage context')
    }

    const fileName = normalizeFileName(latestImageUpload.name)

    try {
        const fileBuffer = await getFileFromStorage(fileName, orgId, chatflowId, chatId)
        nextToolArgs.file = `data:${latestImageUpload.mime};base64,${fileBuffer.toString('base64')}`
        return nextToolArgs
    } catch (error) {
        throw new Error(
            `Unable to inject uploaded chat image '${fileName}' for upload_ad_image: ${
                error instanceof Error ? error.message : String(error)
            }`
        )
    }
}
