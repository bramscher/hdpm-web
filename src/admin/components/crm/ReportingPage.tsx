import React from 'react'
import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import ReportingView from './ReportingView'

export default function ReportingPage(props: AdminViewServerProps) {
  return (
    <DefaultTemplate {...props} visibleEntities={props.initPageResult.visibleEntities}>
      <ReportingView />
    </DefaultTemplate>
  )
}
