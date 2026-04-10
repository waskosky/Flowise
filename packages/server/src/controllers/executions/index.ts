import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import executionsService from '../../services/executions'
import { ExecutionState } from '../../Interface'
import { ChatFlow } from '../../database/entities/ChatFlow'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

const getExecutionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const executionId = req.params.id
        const workspaceId = req.user?.activeWorkspaceId
        const execution = await executionsService.getExecutionById(executionId, workspaceId)
        return res.json(execution)
    } catch (error) {
        next(error)
    }
}

const getPublicExecutionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const executionId = req.params.id
        const execution = await executionsService.getPublicExecutionById(executionId)
        return res.json(execution)
    } catch (error) {
        next(error)
    }
}

const getPublicExecutionStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: executionsController.getPublicExecutionStatus - id not provided!'
            )
        }

        const sessionId = req.query?.sessionId as string | undefined
        if (!sessionId) {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                'Error: executionsController.getPublicExecutionStatus - sessionId not provided!'
            )
        }

        const appServer = getRunningExpressApp()
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow).findOneBy({ id: req.params.id })
        if (!chatflow) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow ${req.params.id} not found`)
        }

        let chatbotConfig: Record<string, any> = {}
        if (chatflow.chatbotConfig) {
            try {
                chatbotConfig = typeof chatflow.chatbotConfig === 'string' ? JSON.parse(chatflow.chatbotConfig) : chatflow.chatbotConfig
            } catch (error) {
                throw new InternalFlowiseError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    `Error parsing Chatbot Config for Chatflow ${req.params.id}`
                )
            }
        }

        if (chatbotConfig?.chatHistory?.enabled === false) {
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, 'Chat history is not enabled')
        }

        let isDomainAllowed = true
        let unauthorizedOriginError = chatbotConfig.allowedOriginsError || 'This site is not allowed to access this chatbot'
        const isValidAllowedOrigins = chatbotConfig.allowedOrigins?.length && chatbotConfig.allowedOrigins[0] !== ''
        if (isValidAllowedOrigins && req.headers.origin) {
            const originHeader = req.headers.origin
            const origin = new URL(originHeader).host
            isDomainAllowed =
                chatbotConfig.allowedOrigins.filter((domain: string) => {
                    try {
                        const allowedOrigin = new URL(domain).host
                        return origin === allowedOrigin
                    } catch (e) {
                        return false
                    }
                }).length > 0
        }

        if (!isDomainAllowed) {
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, unauthorizedOriginError)
        }

        const executionStatus = await executionsService.getPublicExecutionStatus(req.params.id, sessionId)
        return res.json(executionStatus)
    } catch (error) {
        next(error)
    }
}

const updateExecution = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const executionId = req.params.id
        const workspaceId = req.user?.activeWorkspaceId
        const execution = await executionsService.updateExecution(executionId, req.body, workspaceId)
        return res.json(execution)
    } catch (error) {
        next(error)
    }
}

const getAllExecutions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract all possible filters from query params
        const filters: any = {}

        // Add workspace ID filter
        filters.workspaceId = req.user?.activeWorkspaceId

        // ID filter
        if (req.query.id) filters.id = req.query.id as string

        // Flow and session filters
        if (req.query.agentflowId) filters.agentflowId = req.query.agentflowId as string
        if (req.query.agentflowName) filters.agentflowName = req.query.agentflowName as string
        if (req.query.sessionId) filters.sessionId = req.query.sessionId as string

        // State filter
        if (req.query.state) {
            const stateValue = req.query.state as string
            if (['INPROGRESS', 'FINISHED', 'ERROR', 'TERMINATED', 'TIMEOUT', 'STOPPED'].includes(stateValue)) {
                filters.state = stateValue as ExecutionState
            }
        }

        // Date filters
        if (req.query.startDate) {
            filters.startDate = new Date(req.query.startDate as string)
        }

        if (req.query.endDate) {
            filters.endDate = new Date(req.query.endDate as string)
        }

        // Pagination
        if (req.query.page) {
            filters.page = parseInt(req.query.page as string, 10)
        }

        if (req.query.limit) {
            filters.limit = parseInt(req.query.limit as string, 10)
        }

        const apiResponse = await executionsService.getAllExecutions(filters)

        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

/**
 * Delete multiple executions by their IDs
 * If a single ID is provided in the URL params, it will delete that execution
 * If an array of IDs is provided in the request body, it will delete all those executions
 */
const deleteExecutions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let executionIds: string[] = []
        const workspaceId = req.user?.activeWorkspaceId

        // Check if we're deleting a single execution from URL param
        if (req.params.id) {
            executionIds = [req.params.id]
        }
        // Check if we're deleting multiple executions from request body
        else if (req.body.executionIds && Array.isArray(req.body.executionIds)) {
            executionIds = req.body.executionIds
        } else {
            return res.status(400).json({ success: false, message: 'No execution IDs provided' })
        }

        const result = await executionsService.deleteExecutions(executionIds, workspaceId)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

export default {
    getAllExecutions,
    deleteExecutions,
    getExecutionById,
    getPublicExecutionById,
    getPublicExecutionStatus,
    updateExecution
}
