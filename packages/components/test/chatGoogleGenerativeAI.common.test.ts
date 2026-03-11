import { AIMessage } from '@langchain/core/messages'
import {
    convertMessageContentToParts,
    convertResponseContentToChatGenerationChunk,
    mapGenerateContentResultToChatResult
} from '../nodes/chatmodels/ChatGoogleGenerativeAI/utils/common'

const GEMINI_FUNCTION_CALL_PARTS_KEY = 'geminiFunctionCallParts'

describe('ChatGoogleGenerativeAI function call round-trip', () => {
    it('reuses stored raw Gemini functionCall parts when rebuilding message parts', () => {
        const functionCallPart = {
            functionCall: {
                name: 'default_api:get_context',
                args: {
                    query: 'Flowise'
                },
                thoughtSignature: 'signed-thought'
            }
        }

        const message = new AIMessage({
            content: 'Let me check that.',
            tool_calls: [
                {
                    name: 'default_api:get_context',
                    args: {
                        query: 'Flowise'
                    },
                    id: 'tool-call-1',
                    type: 'tool_call'
                }
            ],
            additional_kwargs: {
                [GEMINI_FUNCTION_CALL_PARTS_KEY]: [functionCallPart]
            }
        })

        expect(convertMessageContentToParts(message, true, [])).toEqual([{ text: 'Let me check that.' }, functionCallPart])
    })

    it('stores raw Gemini functionCall parts on non-streaming responses', () => {
        const functionCallPart = {
            functionCall: {
                name: 'default_api:get_context',
                args: {
                    query: 'Flowise'
                },
                thoughtSignature: 'signed-thought'
            }
        }

        const result = mapGenerateContentResultToChatResult(
            {
                candidates: [
                    {
                        content: {
                            parts: [functionCallPart]
                        },
                        finishReason: 'STOP',
                        index: 0
                    }
                ],
                functionCalls: () => [
                    {
                        name: 'default_api:get_context',
                        args: {
                            query: 'Flowise'
                        }
                    }
                ]
            } as any,
            {
                usageMetadata: undefined
            }
        )

        expect((result.generations[0].message as AIMessage).additional_kwargs[GEMINI_FUNCTION_CALL_PARTS_KEY]).toEqual([functionCallPart])
    })

    it('stores raw Gemini functionCall parts on streaming chunks', () => {
        const functionCallPart = {
            functionCall: {
                name: 'default_api:get_context',
                args: {
                    query: 'Flowise'
                },
                thoughtSignature: 'signed-thought'
            }
        }

        const chunk = convertResponseContentToChatGenerationChunk(
            {
                candidates: [
                    {
                        content: {
                            parts: [functionCallPart]
                        },
                        finishReason: 'STOP',
                        index: 0
                    }
                ],
                functionCalls: () => [
                    {
                        name: 'default_api:get_context',
                        args: {
                            query: 'Flowise'
                        }
                    }
                ]
            } as any,
            {
                index: 0
            }
        )

        expect(chunk?.message.additional_kwargs[GEMINI_FUNCTION_CALL_PARTS_KEY]).toEqual([functionCallPart])
    })
})
