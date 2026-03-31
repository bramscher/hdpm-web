import type { Payload } from 'payload'

interface AutomationRule {
  id: number
  name: string
  triggerType: string
  conditions?: Record<string, unknown> | null
  actionType: string
  actionConfig?: Record<string, unknown> | null
  priority: number
  isActive: boolean
}

/**
 * Simple condition matcher: checks if every key in `conditions` matches
 * the corresponding value on the lead object. Supports direct equality only (v1).
 */
function conditionsMatch(
  conditions: Record<string, unknown> | null | undefined,
  lead: Record<string, unknown>,
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true

  for (const [key, expected] of Object.entries(conditions)) {
    const actual = lead[key]
    if (actual !== expected) return false
  }

  return true
}

/**
 * Executes a single automation action against a lead.
 */
async function executeAction(
  payload: Payload,
  rule: AutomationRule,
  lead: { id: number; [key: string]: unknown },
): Promise<void> {
  const config = rule.actionConfig ?? {}

  switch (rule.actionType) {
    case 'create_task': {
      await payload.create({
        collection: 'lead-tasks',
        data: {
          lead: lead.id,
          title: (config.title as string) || `Auto: ${rule.name}`,
          taskType: (config.taskType as string) || 'follow_up',
          status: 'pending',
          priority: (config.priority as string) || 'normal',
          dueAt: config.dueInHours
            ? new Date(Date.now() + Number(config.dueInHours) * 3600000).toISOString()
            : undefined,
          assignedTo: (config.assignedTo as number) || (lead.assignedTo as number) || undefined,
          description: (config.description as string) || undefined,
        },
      })
      break
    }

    case 'change_status': {
      const newStatus = config.status as string
      if (newStatus) {
        await payload.update({
          collection: 'leads',
          id: lead.id,
          data: { status: newStatus },
        })
      }
      break
    }

    case 'send_notification': {
      // v1: Log the notification. Actual sending (email/Slack) will be wired in a later phase.
      payload.logger.info(
        `[CRM Automation] Notification for lead ${lead.id}: ${(config.message as string) || rule.name}`,
      )
      break
    }

    case 'assign_lead': {
      const assignTo = config.userId as number
      if (assignTo) {
        await payload.update({
          collection: 'leads',
          id: lead.id,
          data: { assignedTo: assignTo },
        })
      }
      break
    }

    default:
      payload.logger.warn(`[CRM Automation] Unknown action type: ${rule.actionType}`)
  }
}

/**
 * Evaluate all active automation rules for a given trigger and lead.
 * Rules are fetched ordered by priority (ascending) and executed sequentially.
 */
export async function evaluateRules(
  payload: Payload,
  trigger: string,
  lead: { id: number; [key: string]: unknown },
): Promise<void> {
  try {
    const { docs: rules } = await payload.find({
      collection: 'automation-rules',
      where: {
        triggerType: { equals: trigger },
        isActive: { equals: true },
      },
      sort: 'priority',
      limit: 100,
    })

    for (const rule of rules as unknown as AutomationRule[]) {
      if (!conditionsMatch(rule.conditions, lead)) continue

      try {
        await executeAction(payload, rule, lead)
        payload.logger.info(
          `[CRM Automation] Executed rule "${rule.name}" (${rule.actionType}) for lead ${lead.id}`,
        )
      } catch (error) {
        payload.logger.error(
          `[CRM Automation] Failed to execute rule "${rule.name}" for lead ${lead.id}: ${error}`,
        )
      }
    }
  } catch (error) {
    payload.logger.error(`[CRM Automation] Failed to fetch rules for trigger "${trigger}": ${error}`)
  }
}
