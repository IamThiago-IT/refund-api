import { RefundService } from '#services/refunds_service'
import {
  createRefundValidator,
  listRefundValidator,
  showRefundValidator,
  softDeleteRefundValidator,
} from '#validators/refund_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class RefundsController {
  constructor(private refundService: RefundService) {}
  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const payload = await request.validateUsing(listRefundValidator, {
      data: request.qs(),
    })

    return this.refundService.all(payload)
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request }: HttpContext) {
    const payload = await request.validateUsing(createRefundValidator)

    return this.refundService.create(payload)
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const payload = await request.validateUsing(showRefundValidator, {
      data: { params: request.params() },
    })

    return this.refundService.findById(payload)
  }

  /**
   * Delete record
   */
  async destroy({ request }: HttpContext) {
    const payload = await request.validateUsing(softDeleteRefundValidator, {
      data: { params: request.params() },
    })

    return this.refundService.softDelete(payload)
  }
}
