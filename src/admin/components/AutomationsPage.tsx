import React from 'react'
import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import AutomationsView from './AutomationsView'

export default function AutomationsPage(props: AdminViewServerProps) {
  return (
    <DefaultTemplate {...props}>
      <AutomationsView />
    </DefaultTemplate>
  )
}
