import { StatusCodes } from 'http-status-codes'
import supertest from 'supertest'
import { v4 as uuidv4 } from 'uuid'
import { EnumChatflowType, ChatFlow } from '../../../src/database/entities/ChatFlow'
import { Execution } from '../../../src/database/entities/Execution'
import { Organization } from '../../../src/enterprise/database/entities/organization.entity'
import { User, UserStatus } from '../../../src/enterprise/database/entities/user.entity'
import { Workspace } from '../../../src/enterprise/database/entities/workspace.entity'
import { getRunningExpressApp } from '../../../src/utils/getRunningExpressApp'

export function publicExecutionStatusRouteTest() {
    describe('Public Execution Status Route', () => {
        const route = '/api/v1/public-executions/status'
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
        let missingSessionId = ''
        let publicExecutionId = ''

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
            missingSessionId = uuidv4()

            await chatflowRepo.save({
                id: publicChatflowId,
                name: 'Public Execution Status Test',
                flowData: JSON.stringify({ nodes: [], edges: [] }),
                isPublic: true,
                chatbotConfig: JSON.stringify({ chatHistory: { enabled: true } }),
                type: EnumChatflowType.AGENTFLOW,
                workspaceId: testData.workspaceId
            })
            await chatflowRepo.save({
                id: disabledChatflowId,
                name: 'Public Execution Status Disabled',
                flowData: JSON.stringify({ nodes: [], edges: [] }),
                isPublic: true,
                chatbotConfig: JSON.stringify({ chatHistory: { enabled: false } }),
                type: EnumChatflowType.AGENTFLOW,
                workspaceId: testData.workspaceId
            })
            testData.chatflowIds.push(publicChatflowId, disabledChatflowId)

            const execution = executionRepo.create({
                agentflowId: publicChatflowId,
                sessionId: publicSessionId,
                state: 'FINISHED',
                isPublic: true,
                workspaceId: testData.workspaceId,
                stoppedDate: new Date('2024-01-01T00:00:10.000Z'),
                executionData: JSON.stringify([
                    {
                        nodeId: 'agent_0',
                        nodeLabel: 'Agent',
                        status: 'FINISHED',
                        data: {
                            output: {
                                content: 'done'
                            }
                        }
                    }
                ])
            })
            const savedExecution = await executionRepo.save(execution)
            publicExecutionId = savedExecution.id
            testData.executionIds.push(publicExecutionId)
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

        describe(`GET ${route}/:id without sessionId`, () => {
            it(`should return a ${StatusCodes.BAD_REQUEST} status`, async () => {
                await supertest(getRunningExpressApp().app).get(`${route}/${publicChatflowId}`).expect(StatusCodes.BAD_REQUEST)
            })
        })

        describe(`GET ${route}/:id when chat history is disabled`, () => {
            it(`should return a ${StatusCodes.FORBIDDEN} status`, async () => {
                await supertest(getRunningExpressApp().app)
                    .get(`${route}/${disabledChatflowId}?sessionId=${disabledSessionId}`)
                    .expect(StatusCodes.FORBIDDEN)
            })
        })

        describe(`GET ${route}/:id when no execution exists yet`, () => {
            it(`should return a ${StatusCodes.OK} status with accepted state`, async () => {
                await supertest(getRunningExpressApp().app)
                    .get(`${route}/${publicChatflowId}?sessionId=${missingSessionId}`)
                    .expect(StatusCodes.OK)
                    .then((response) => {
                        expect(response.body).toMatchObject({
                            chatflowId: publicChatflowId,
                            sessionId: missingSessionId,
                            status: 'ACCEPTED',
                            executionId: null,
                            error: null
                        })
                    })
            })
        })

        describe(`GET ${route}/:id when execution exists`, () => {
            it(`should return a ${StatusCodes.OK} status with execution metadata`, async () => {
                await supertest(getRunningExpressApp().app)
                    .get(`${route}/${publicChatflowId}?sessionId=${publicSessionId}`)
                    .expect(StatusCodes.OK)
                    .then((response) => {
                        expect(response.body).toMatchObject({
                            chatflowId: publicChatflowId,
                            sessionId: publicSessionId,
                            status: 'FINISHED',
                            executionId: publicExecutionId,
                            error: null
                        })
                    })
            })
        })
    })
}
