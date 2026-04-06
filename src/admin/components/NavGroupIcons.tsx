'use client'

import { useEffect } from 'react'

/**
 * Injects SVG icons into Payload's native collection group headers.
 */
export default function NavGroupIcons() {
  useEffect(() => {
    const icons: Record<string, string> = {
      Content: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5;flex-shrink:0"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
      CRM: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5;flex-shrink:0"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
      Admin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5;flex-shrink:0"><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    }

    function injectIcons() {
      const navGroups = document.querySelectorAll('[class*="nav-group"] [class*="nav-group__toggle"]')
      navGroups.forEach((button) => {
        if (button.querySelector('.nav-group-icon')) return
        const label = button.textContent?.trim() || ''
        const iconSvg = icons[label]
        if (!iconSvg) return

        const iconSpan = document.createElement('span')
        iconSpan.className = 'nav-group-icon'
        iconSpan.innerHTML = iconSvg
        iconSpan.style.display = 'inline-flex'
        iconSpan.style.marginRight = '6px'

        const firstChild = button.firstChild
        if (firstChild) {
          button.insertBefore(iconSpan, firstChild)
        }
      })
    }

    injectIcons()
    const observer = new MutationObserver(() => {
      requestAnimationFrame(injectIcons)
    })
    const nav = document.querySelector('nav')
    if (nav) {
      observer.observe(nav, { childList: true, subtree: true })
    }
    return () => observer.disconnect()
  }, [])

  return null
}
