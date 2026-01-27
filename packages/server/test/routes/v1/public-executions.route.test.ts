import { StatusCodes } from 'http-status-codes'
import supertest from 'supertest'
import { v4 as uuidv4 } from 'uuid'
import { ChatFlow } from '../../../src/database/entities/ChatFlow'
import { Execution } from '../../../src/database/entities/Execution'
import { Organization } from '../../../src/enterprise/database/entities/organization.entity'
import { User, UserStatus } from '../../../src/enterprise/database/entities/user.entity'
import { Workspace } from '../../../src/enterprise/database/entities/workspace.entity'
import { getRunningExpressApp } from '../../../src/utils/getRunningExpressApp'

export function publicExecutionsRouteTest() {
    describe('Public Executions Route', () => {
        const route = '/api/v1/public-executions/by-session'
        const testData = {
            chatflowIds: [] as string[],
            executionIds: [] as string[],
            organizationId: '',
            userId: '',
            workspaceId: '',
            createdWorkspace: false
        }

        let publicChatflowId = ''
        let publicSessionId = ''
        let disabledChatflowId = ''
        let disabledSessionId = ''

        beforeAll(async () => {
            const appServer = getRunningExpressApp()
            const chatflowRepo = appServer.AppDataSource.getRepository(ChatFlow)
            const executionRepo = appServer.AppDataSource.getRepository(Execution)
            const workspaceRows: Array<{ id: string }> = await appServer.AppDataSource.query('SELECT id FROM workspace LIMIT 1')

            if (!workspaceRows.length) {
                const userRepo = appServer.AppDataSource.getRepository(User)
                const organizationRepo = appServer.AppDataSource.getRepository(Organization)
                const workspaceRepo = appServer.AppDataSource.getRepository(Workspace)
                const userId = uuidv4()
                const organizationId = uuidv4()
                const workspaceId = uuidv4()
                const userEmail = `test-${userId}@example.com`

                await userRepo.save({
                    id: userId,
                    name: 'Test User',
                    email: userEmail,
                    status: UserStatus.ACTIVE,
                    createdBy: userId,
                    updatedBy: userId
                })
                await organizationRepo.save({
                    id: organizationId,
                    name: 'Test Organization',
                    createdBy: userId,
                    updatedBy: userId
                })
                await workspaceRepo.save({
                    id: workspaceId,
                    name: 'Test Workspace',
                    organizationId,
                    createdBy: userId,
                    updatedBy: userId
                })

                testData.createdWorkspace = true
                testData.organizationId = organizationId
                testData.userId = userId
                testData.workspaceId = workspaceId
            } else {
                testData.workspaceId = workspaceRows[0].id
            }

            publicChatflowId = uuidv4()
            publicSessionId = uuidv4()
            disabledChatflowId = uuidv4()
            disabledSessionId = uuidv4()

            await chatflowRepo.save({
                id: publicChatflowId,
                name: 'Public Execution Test',
                flowData: JSON.stringify({ nodes: [], edges: [] }),
                isPublic: true,
                chatbotConfig: JSON.stringify({ chatHistory: { enabled: true } }),
                workspaceId: testData.workspaceId
            })
            await chatflowRepo.save({
                id: disabledChatflowId,
                name: 'Execution History Disabled',
                flowData: JSON.stringify({ nodes: [], edges: [] }),
                isPublic: true,
                chatbotConfig: JSON.stringify({ chatHistory: { enabled: false } }),
                workspaceId: testData.workspaceId
            })

            testData.chatflowIds.push(publicChatflowId, disabledChatflowId)

            const executionData = [
                {
                    nodeId: 'startAgentflow_0',
                    nodeLabel: 'Start',
                    data: {
                        id: 'startAgentflow_0',
                        name: 'startAgentflow',
                        FLOWISE_CREDENTIAL_ID: 'secret'
                    },
                    status: 'INPROGRESS'
                }
            ]

            const execution = executionRepo.create({
                agentflowId: publicChatflowId,
                sessionId: publicSessionId,
                workspaceId: testData.workspaceId,
                executionData: JSON.stringify(executionData),
                state: 'INPROGRESS',
                isPublic: true
            })
            const savedExecution = await executionRepo.save(execution)
            testData.executionIds.push(savedExecution.id)
        })

        afterAll(async () => {
            const appServer = getRunningExpressApp()
            const chatflowRepo = appServer.AppDataSource.getRepository(ChatFlow)
            const executionRepo = appServer.AppDataSource.getRepository(Execution)
            const workspaceRepo = appServer.AppDataSource.getRepository(Workspace)
            const organizationRepo = appServer.AppDataSource.getRepository(Organization)
            const userRepo = appServer.AppDataSource.getRepository(User)

            if (testData.executionIds.length) {
                await executionRepo.delete(testData.executionIds)
            }
            if (testData.chatflowIds.length) {
                await chatflowRepo.delete(testData.chatflowIds)
            }
            if (testData.createdWorkspace) {
                if (testData.workspaceId) {
                    await workspaceRepo.delete(testData.workspaceId)
                }
                if (testData.organizationId) {
                    await organizationRepo.delete(testData.organizationId)
                }
                if (testData.userId) {
                    await userRepo.delete(testData.userId)
                }
            }
        })

        describe(`GET ${route} without chatflowId`, () => {
            it(`should return a ${StatusCodes.BAD_REQUEST} status`, async () => {
                await supertest(getRunningExpressApp().app)
                    .get(`${route}?sessionId=${publicSessionId}`)
                    .expect(StatusCodes.BAD_REQUEST)
            })
        })

        describe(`GET ${route} without sessionId`, () => {
            it(`should return a ${StatusCodes.BAD_REQUEST} status`, async () => {
                await supertest(getRunningExpressApp().app)
                    .get(`${route}?chatflowId=${publicChatflowId}`)
                    .expect(StatusCodes.BAD_REQUEST)
            })
        })

        describe(`GET ${route} when chat history is disabled`, () => {
            it(`should return a ${StatusCodes.FORBIDDEN} status`, async () => {
                await supertest(getRunningExpressApp().app)
                    .get(`${route}?chatflowId=${disabledChatflowId}&sessionId=${disabledSessionId}`)
                    .expect(StatusCodes.FORBIDDEN)
            })
        })

        describe(`GET ${route} returns latest execution data`, () => {
            it(`should return a ${StatusCodes.OK} status with sanitized execution data`, async () => {
                await supertest(getRunningExpressApp().app)
                    .get(`${route}?chatflowId=${publicChatflowId}&sessionId=${publicSessionId}`)
                    .expect(StatusCodes.OK)
                    .then((response) => {
                        const body = response.body
                        expect(body.id).toBeDefined()
                        expect(body.state).toEqual('INPROGRESS')
                        expect(typeof body.executionData).toEqual('string')

                        const parsedExecutionData = JSON.parse(body.executionData)
                        expect(parsedExecutionData[0].data.FLOWISE_CREDENTIAL_ID).toBeUndefined()
                    })
            })
        })
    })
}
