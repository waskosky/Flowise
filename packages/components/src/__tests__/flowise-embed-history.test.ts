import fs from 'fs'

const readText = (filePath: string) => fs.readFileSync(filePath, 'utf8')

describe('flowise-embed includeHistory integration', () => {
    test('web.js bundle references includeHistory, public-chatmessage, and public-executions', () => {
        const webJsPath = require.resolve('flowise-embed/dist/web.js')
        const contents = readText(webJsPath)

        expect(contents).toContain('includeHistory')
        expect(contents).toContain('usePolling')
        expect(contents).toContain('public-chatmessage')
        expect(contents).toContain('public-executions/by-session')
        expect(contents).toContain('sessionId=')
        expect(contents).toContain('chatId=')
    })

    test('web.umd.js bundle references includeHistory, public-chatmessage, and public-executions', () => {
        const webUmdPath = require.resolve('flowise-embed/dist/web.umd.js')
        const contents = readText(webUmdPath)

        expect(contents).toContain('includeHistory')
        expect(contents).toContain('usePolling')
        expect(contents).toContain('public-chatmessage')
        expect(contents).toContain('public-executions/by-session')
        expect(contents).toContain('sessionId=')
        expect(contents).toContain('chatId=')
    })

    test('web.js bundle persists sessionId when storing history', () => {
        const webJsPath = require.resolve('flowise-embed/dist/web.js')
        const contents = readText(webJsPath)

        expect(contents).toContain('chatHistory:n,sessionId:t')
        expect(contents).toContain('sessionId!==t')
    })

    test('web.js bundle scopes external storage by session key', () => {
        const webJsPath = require.resolve('flowise-embed/dist/web.js')
        const contents = readText(webJsPath)

        expect(contents).toContain('_EXTERNAL_')
    })

    test('web.umd.js bundle persists sessionId when storing history', () => {
        const webUmdPath = require.resolve('flowise-embed/dist/web.umd.js')
        const contents = readText(webUmdPath)

        expect(contents).toContain('chatHistory:n,sessionId:t')
        expect(contents).toContain('sessionId!==t')
    })

    test('web.umd.js bundle scopes external storage by session key', () => {
        const webUmdPath = require.resolve('flowise-embed/dist/web.umd.js')
        const contents = readText(webUmdPath)

        expect(contents).toContain('_EXTERNAL_')
    })

    test('web.js bundle defaults usePolling to true', () => {
        const webJsPath = require.resolve('flowise-embed/dist/web.js')
        const contents = readText(webJsPath)

        expect(contents).toContain('usePolling:!0')
    })

    test('web.umd.js bundle defaults usePolling to true', () => {
        const webUmdPath = require.resolve('flowise-embed/dist/web.umd.js')
        const contents = readText(webUmdPath)

        expect(contents).toContain('usePolling:!0')
    })

    test('type definitions expose includeHistory on Chatbot init', () => {
        const webDtsPath = require.resolve('flowise-embed/dist/web.d.ts')
        const windowDtsPath = require.resolve('flowise-embed/dist/window.d.ts')
        const botDtsPath = require.resolve('flowise-embed/dist/components/Bot.d.ts')

        expect(readText(webDtsPath)).toContain('includeHistory')
        expect(readText(windowDtsPath)).toContain('includeHistory')
        expect(readText(botDtsPath)).toContain('includeHistory')

        expect(readText(webDtsPath)).toContain('usePolling')
        expect(readText(windowDtsPath)).toContain('usePolling')
        expect(readText(botDtsPath)).toContain('usePolling')
    })
})
