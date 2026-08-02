/**
 * Seed/refresh the legal pages: /privacy (real policy body), /terms and
 * /accessibility (new), and unpublish the /services and /residents stubs
 * (both 301 away in next.config.ts).
 *
 * Content ported from the live site (www.highdesertpm.com/privacy-policy,
 * /accessibility, /cookie-policy) on 2026-08-01 and rewritten for clarity.
 * Terms and the accessibility statement should get counsel review.
 *
 * Usage: npx tsx scripts/seed-legal-pages.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

/* ─── Lexical helpers (same shapes as scripts/seed-blog.ts) ─── */

function text(t: string) {
  return { type: 'text', text: t, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }
}

function heading(t: string, tag: 'h2' | 'h3' = 'h2') {
  return {
    type: 'heading',
    tag,
    children: [text(t)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function paragraph(t: string) {
  return {
    type: 'paragraph',
    children: [text(t)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    textFormat: 0,
    textStyle: '',
  }
}

function bulletList(items: string[]) {
  return {
    type: 'list',
    listType: 'bullet',
    tag: 'ul',
    start: 1,
    children: items.map((item, i) => ({
      type: 'listitem',
      value: i + 1,
      children: [text(item)],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    })),
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

type Node = ReturnType<typeof heading | typeof paragraph | typeof bulletList>

function richText(nodes: Node[]) {
  return {
    root: {
      type: 'root',
      children: nodes,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

/* ─── Shared strings ─── */

const CONTACT = 'High Desert Property Management, 1515 SW Reindeer Ave, Redmond, OR 97756 · (541) 548-0383 · info@highdesertpm.com'

/* ─── Privacy Policy ─── */

const privacyBody = richText([
  paragraph('Last updated: August 1, 2026'),
  paragraph(
    'High Desert Property Management ("we," "us," or "our") respects your privacy. This policy explains what personal information we collect through this website, how we use it, and the choices you have. It applies to highdesertpm.com and the forms and services offered through it.',
  ),
  heading('Information we collect'),
  paragraph(
    'When you submit our contact form, request a free rental analysis, or email us, we collect the information you provide — typically your name, email address, phone number, and, for rental analysis requests, details about your property such as its address, size, and current rent.',
  ),
  paragraph(
    'Like most websites, we also collect standard technical information (such as browser type and pages visited) through cookies and similar technologies, described below.',
  ),
  heading('How we use your information'),
  bulletList([
    'To respond to your inquiries and provide the information or services you request, such as a rental analysis.',
    'To communicate with you about your tenancy, your property, or your account with us.',
    'To improve our website and services.',
    'To maintain security and prevent fraud.',
  ]),
  paragraph(
    'We do not share mobile phone numbers or text-messaging opt-in consent with third parties or affiliates for marketing or promotional purposes.',
  ),
  heading('AI-assisted messaging'),
  paragraph(
    'High Desert Property Management uses AI-assisted conversational messaging to respond to leasing inquiries, maintenance requests, scheduling, and customer support. Messages are reviewed and managed by company staff as needed.',
  ),
  heading('Cookies and analytics'),
  paragraph(
    'Cookies are small text files placed on your device that help the site function and help us understand how visitors use it. We use cookies and analytics services (such as Google Analytics) to compile aggregate data about site traffic and interactions so we can improve the experience. You can disable cookies in your browser settings at any time; the site will continue to work.',
  ),
  heading('How we protect your information'),
  paragraph(
    'This site is served over an encrypted (HTTPS/SSL) connection, and your personal information is accessible only to a limited number of staff who are required to keep it confidential. We do not store payment card information on our servers; any payments are processed by dedicated payment providers such as the AppFolio resident and owner portals.',
  ),
  heading('Sharing with third parties'),
  paragraph(
    'We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties without advance notice. This does not include service providers who help us operate our website and business — such as our property-management software (AppFolio), website hosting, and email providers — who are required to keep your information confidential. We may also release information when required to comply with the law or to protect rights, property, or safety.',
  ),
  heading('Third-party links'),
  paragraph(
    'This site links to third-party services, including the AppFolio resident and owner portals and rental listing pages. Those sites have their own independent privacy policies, and we are not responsible for their content or practices.',
  ),
  heading('Children’s privacy'),
  paragraph(
    'Our services are not directed to children, and we do not knowingly collect personal information from children under 13, consistent with the Children’s Online Privacy Protection Act (COPPA).',
  ),
  heading('Your choices and California privacy rights'),
  paragraph(
    'You can browse this site anonymously. You may request to review, update, or delete the personal information you have provided, or opt out of future emails, by contacting us at info@highdesertpm.com — we will promptly remove you from all correspondence on request. Consistent with the California Online Privacy Protection Act (CalOPPA), this policy is linked from the footer of every page, and any changes to it will be posted on this page.',
  ),
  heading('Do Not Track'),
  paragraph(
    'Some browsers send "Do Not Track" signals. We do not use third-party behavioral tracking or serve interest-based advertising on this site.',
  ),
  heading('Data breach notification'),
  paragraph(
    'If a data breach affecting your personal information occurs, we will notify affected users within 7 business days via an on-site notification and, where possible, by email.',
  ),
  heading('Email practices'),
  paragraph(
    'We comply with the CAN-SPAM Act: we do not use false or misleading subjects or sender addresses, we include our physical business address in our emails, and we honor unsubscribe requests promptly. To unsubscribe at any time, email info@highdesertpm.com.',
  ),
  heading('Contact us'),
  paragraph(`Questions about this policy? Contact ${CONTACT}.`),
])

/* ─── Terms of Service ─── */

const termsBody = richText([
  paragraph('Last updated: August 1, 2026'),
  paragraph(
    'These Terms of Service ("Terms") govern your use of the High Desert Property Management website at highdesertpm.com (the "Site"). By using the Site, you agree to these Terms. If you do not agree, please do not use the Site.',
  ),
  heading('Use of the Site'),
  paragraph(
    'The Site provides information about our property management services, current rental listings, and access to resident and owner portals. You agree to use the Site only for lawful purposes and in a way that does not infringe the rights of, or restrict the use of the Site by, anyone else.',
  ),
  heading('Rental listings and information accuracy'),
  paragraph(
    'Rental listings, availability, rents, and property details displayed on the Site are provided for convenience and are subject to change or removal at any time without notice. While we work to keep information current, we do not guarantee that any listing, rent estimate, or other content on the Site is accurate, complete, or up to date. A rental analysis provided through the Site is an informational estimate, not an appraisal or a guarantee of rental income.',
  ),
  heading('Resident and owner portals'),
  paragraph(
    'The resident and owner portals are operated by AppFolio, Inc., a third-party provider. Your use of the portals is governed by the terms and privacy policy presented within those services. We are not responsible for the availability of third-party services.',
  ),
  heading('Fair housing'),
  paragraph(
    'High Desert Property Management is committed to the letter and spirit of the federal Fair Housing Act and Oregon fair housing laws. We do business in accordance with equal housing opportunity requirements and do not discriminate on the basis of race, color, religion, sex, disability, familial status, national origin, or any other protected class.',
  ),
  heading('Intellectual property'),
  paragraph(
    'The content of the Site — including text, images, logos, and design — is owned by High Desert Property Management or its licensors and is protected by copyright and trademark law. You may not reproduce or distribute Site content without our prior written permission, except for personal, non-commercial use.',
  ),
  heading('Disclaimer of warranties'),
  paragraph(
    'The Site is provided "as is" and "as available," without warranties of any kind, express or implied. Nothing on the Site constitutes legal, financial, or investment advice.',
  ),
  heading('Limitation of liability'),
  paragraph(
    'To the fullest extent permitted by law, High Desert Property Management will not be liable for any indirect, incidental, or consequential damages arising from your use of, or inability to use, the Site or its content.',
  ),
  heading('Changes to these Terms'),
  paragraph(
    'We may update these Terms from time to time. The "Last updated" date above reflects the most recent revision, and continued use of the Site after changes are posted constitutes acceptance of the revised Terms.',
  ),
  heading('Governing law'),
  paragraph(
    'These Terms are governed by the laws of the State of Oregon. Any dispute arising from them will be resolved in the state or federal courts located in Deschutes County, Oregon.',
  ),
  heading('Contact'),
  paragraph(`Questions about these Terms? Contact ${CONTACT}.`),
])

/* ─── Accessibility Statement ─── */

const accessibilityBody = richText([
  heading('Our commitment'),
  paragraph(
    'High Desert Property Management is committed to making our website accessible to all persons, including people with disabilities. In furtherance of that commitment, we proactively work to align this website with the World Wide Web Consortium’s Web Content Accessibility Guidelines (WCAG) to support the use of assistive technologies and provide accessible content.',
  ),
  heading('Ongoing effort'),
  paragraph(
    'Accessibility is an ongoing effort. We review the site regularly and work to remediate issues as they are identified, including maintaining sufficient color contrast, descriptive alternative text for images, keyboard navigability, and clear heading structure.',
  ),
  heading('Tell us about an issue'),
  paragraph(
    'If you encounter any accessibility barriers while visiting our website, need services or information in an accessible format, or have suggestions for improvement, we want to hear from you. Contact us at info@highdesertpm.com or (541) 548-0383. TTY users can reach us by dialing 711 (Telecommunications Relay Service).',
  ),
  heading('Fair housing'),
  paragraph(
    'We do business in accordance with the federal Fair Housing Act and Oregon fair housing laws, and we provide reasonable accommodations in our rental practices for persons with disabilities. To request an accommodation, contact our office.',
  ),
  heading('Contact'),
  paragraph(CONTACT),
])

/* ─── Page definitions ─── */

const LEGAL_PAGES = [
  {
    title: 'Privacy Policy',
    slug: 'privacy',
    layout: 'privacy',
    status: 'published',
    richContent: {
      heroHeading: 'Privacy Policy',
      heroSubheading: 'How we collect, use, and protect your information.',
      body: privacyBody,
    },
  },
  {
    title: 'Terms of Service',
    slug: 'terms',
    layout: 'privacy', // rich-text layout; renders hero + body
    status: 'published',
    richContent: {
      heroHeading: 'Terms of Service',
      heroSubheading: 'The terms that govern your use of this website.',
      body: termsBody,
    },
  },
  {
    title: 'Accessibility',
    slug: 'accessibility',
    layout: 'privacy', // rich-text layout; renders hero + body
    status: 'published',
    richContent: {
      heroHeading: 'Accessibility Statement',
      heroSubheading:
        'Our commitment to an accessible website and equal housing opportunity.',
      body: accessibilityBody,
    },
  },
]

// Stubs replaced by 301s in next.config.ts — unpublish so they drop out of
// the sitemap and can never render again.
const UNPUBLISH_SLUGS = ['services', 'residents']

async function seed() {
  console.log('⚖️  Seeding legal pages...\n')
  const payload = await getPayload({ config })

  for (const page of LEGAL_PAGES) {
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      limit: 1,
    })
    if (existing.docs[0]) {
      await payload.update({
        collection: 'pages',
        id: existing.docs[0].id,
        data: page as never,
      })
      console.log(`  ✏️  Updated /${page.slug}`)
    } else {
      await payload.create({ collection: 'pages', data: page as never })
      console.log(`  ✨ Created /${page.slug}`)
    }
  }

  for (const slug of UNPUBLISH_SLUGS) {
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (existing.docs[0]) {
      await payload.update({
        collection: 'pages',
        id: existing.docs[0].id,
        data: { status: 'draft' },
      })
      console.log(`  📴 Unpublished /${slug} (301s to its replacement)`)
    } else {
      console.log(`  ⏭️  /${slug} not found — nothing to unpublish`)
    }
  }

  console.log('\n✅ Done.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
