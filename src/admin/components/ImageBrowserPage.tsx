import React from 'react'
import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import ImageBrowser from './ImageBrowser'

export default function ImageBrowserPage(props: AdminViewServerProps) {
  return (
    <DefaultTemplate {...props}>
      <ImageBrowser />
    </DefaultTemplate>
  )
}
