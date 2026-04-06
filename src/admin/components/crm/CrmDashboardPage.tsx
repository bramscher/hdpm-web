import React from 'react'
import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import CrmDashboardView from './CrmDashboardView'

export default function CrmDashboardPage(props: AdminViewServerProps) {
  return (
    <DefaultTemplate {...props}>
      <CrmDashboardView />
    </DefaultTemplate>
  )
}
