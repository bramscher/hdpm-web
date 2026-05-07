import React from 'react'
import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import InboxView from './InboxView'

export default function InboxPage(props: AdminViewServerProps) {
  return (
    <DefaultTemplate {...props} visibleEntities={props.initPageResult.visibleEntities}>
      <InboxView />
    </DefaultTemplate>
  )
}
