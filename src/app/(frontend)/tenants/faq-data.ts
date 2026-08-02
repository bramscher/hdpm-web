// Shared between the client accordion (TenantFAQ) and the server page
// (FAQPage JSON-LD) so the structured data always matches what renders.

export interface FAQItem {
  question: string
  answer: string
}

export const defaultFaqs: FAQItem[] = [
  {
    question: 'How much is the security deposit?',
    answer:
      "Security deposits are typically equal to one month's rent, though this may vary depending on the property and your application. The exact deposit amount is stated in your lease agreement. Deposits are held in a trust account and returned (less any deductions for damages beyond normal wear and tear) within 31 days of move-out, per Oregon law.",
  },
  {
    question: 'What is your pet policy?',
    answer:
      'Pet policies vary by property. Many of our rentals do allow pets with an additional pet deposit and/or monthly pet rent. Breed and weight restrictions may apply. Please check the specific listing for pet details or contact our office. Service and emotional support animals are accommodated in accordance with Fair Housing laws.',
  },
  {
    question: 'How long are lease terms?',
    answer:
      'Most of our leases are 12-month terms. Some properties may offer shorter or longer lease options. At the end of your initial lease term, you may be offered a renewal or the lease may convert to a month-to-month agreement, depending on the property and owner preferences.',
  },
  {
    question: 'How do I submit a maintenance request?',
    answer:
      'Log into the tenant portal at any time to submit a maintenance request. Provide a detailed description of the issue and photos if possible. For true emergencies (flooding, fire, gas leak, no heat in winter), call our 24/7 emergency line immediately. Non-emergency requests are typically addressed within 1-3 business days.',
  },
  {
    question: 'When is rent due and how do I pay?',
    answer:
      'Rent is due on the 1st of each month. You can pay online through the tenant portal via ACH bank transfer or credit/debit card. We strongly recommend setting up auto-pay to ensure you never miss a payment. Late fees apply after any applicable grace period as outlined in your lease.',
  },
  {
    question: 'What do I need to apply?',
    answer:
      'You will need a valid government-issued photo ID, proof of income (recent pay stubs or employment letter), and your rental history for the past 3 years. Each adult applicant (18+) must submit a separate application and pay a non-refundable application fee. We run credit checks, criminal background checks, and verify employment and rental references.',
  },
  {
    question: 'Can I make changes or improvements to the property?',
    answer:
      'Any modifications to the property — including painting, installing fixtures, or landscaping changes — require prior written approval from the management team. Unauthorized alterations may result in charges at move-out. Contact our office to discuss your proposed changes before making them.',
  },
  {
    question: 'What happens if I need to break my lease early?',
    answer:
      'Early lease termination is handled on a case-by-case basis. Generally, you are responsible for rent through the end of the lease term or until a new qualified tenant is placed, whichever comes first. An early termination fee may also apply as outlined in your lease. Please contact our office as soon as possible to discuss your options.',
  },
]
