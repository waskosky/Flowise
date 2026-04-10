import express from 'express'
import executionController from '../../controllers/executions'
const router = express.Router()

// CREATE

// READ
router.get('/status/:id', executionController.getPublicExecutionStatus)
router.get(['/', '/:id'], executionController.getPublicExecutionById)

// UPDATE

// DELETE

export default router
