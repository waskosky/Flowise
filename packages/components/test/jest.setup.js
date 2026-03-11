const { ReadableStream, TransformStream, WritableStream } = require('node:stream/web')

if (typeof global.fetch === 'undefined' && typeof globalThis.fetch === 'function') {
    global.fetch = globalThis.fetch.bind(globalThis)
}

if (typeof global.Headers === 'undefined' && typeof globalThis.Headers !== 'undefined') {
    global.Headers = globalThis.Headers
}

if (typeof global.Request === 'undefined' && typeof globalThis.Request !== 'undefined') {
    global.Request = globalThis.Request
}

if (typeof global.Response === 'undefined' && typeof globalThis.Response !== 'undefined') {
    global.Response = globalThis.Response
}

if (typeof global.FormData === 'undefined' && typeof globalThis.FormData !== 'undefined') {
    global.FormData = globalThis.FormData
}

if (typeof global.Blob === 'undefined' && typeof globalThis.Blob !== 'undefined') {
    global.Blob = globalThis.Blob
}

if (typeof global.File === 'undefined' && typeof globalThis.File !== 'undefined') {
    global.File = globalThis.File
}

if (typeof global.ReadableStream === 'undefined') {
    global.ReadableStream = ReadableStream
}

if (typeof global.TransformStream === 'undefined') {
    global.TransformStream = TransformStream
}

if (typeof global.WritableStream === 'undefined') {
    global.WritableStream = WritableStream
}
