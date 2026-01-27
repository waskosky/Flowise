import express from 'express'
import executionController from '../../controllers/executions'
const router = express.Router()

// CREATE

// READ
router.get('/by-session', executionController.getPublicExecutionBySession)
router.get(['/', '/:id'], executionController.getPublicExecutionById)

// UPDATE

// DELETE

export default router
