import React from 'react'
import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import ReportingView from './ReportingView'

export default function ReportingPage(props: AdminViewServerProps) {
  return (
    <DefaultTemplate {...props}>
      <ReportingView />
    </DefaultTemplate>
  )
}
