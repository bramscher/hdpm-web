import { getPayload } from 'payload'
import config from '@payload-config'
import { sendLeadNotification } from '@/lib/notify'
import { createRentalAnalysisHandler } from '@/lib/crm/rental-analysis-intake'

export const POST = createRentalAnalysisHandler({
  getPayload: () => getPayload({ config }),
  sendLeadNotification,
  fetch: globalThis.fetch,
  chatbotBaseUrl: process.env.HDPM_CHATBOT_BASE_URL || '',
  serviceToken: process.env.HDPM_SERVICE_TOKEN || '',
})
