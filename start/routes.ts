/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const ReceiptDownloadsController = () => import('#controllers/receipt_downloads_controller')
const ReceiptsController = () => import('#controllers/receipts_controller')
const RefundsController = () => import('#controllers/refunds_controller')

import AutoSwagger from 'adonis-autoswagger'
import swaggerConfig from '#config/swagger'

import router from '@adonisjs/core/services/router'

const autoSwagger = (AutoSwagger as any).default as any

router.resource('refunds', RefundsController).only(['index', 'store', 'show', 'destroy'])
router.resource('receipts', ReceiptsController).only(['store', 'show', 'destroy'])
router.get('receipts/download/:id', [ReceiptDownloadsController])

router.get('/swagger', async () => {
  return autoSwagger.docs(router.toJSON(), swaggerConfig)
})

router.get('/docs', async () => {
  return autoSwagger.ui('/swagger', swaggerConfig)
})
