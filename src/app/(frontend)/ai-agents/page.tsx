import Link from 'next/link'
import Image from 'next/image'
import ScrollHero from '@/components/ui/ScrollHero'
import { createMetadata } from '@/lib/seo'
import { breadcrumbSchema, faqSchema } from '@/lib/schema'
import { SITE_URL } from '@/lib/site-url'
import { AGENT_LIST } from '@/lib/agents'
import { FOUNDED_YEAR } from '@/lib/constants'
import Section from '@/components/ui/Section'
import Card from '@/components/ui/Card'
import Reveal from '@/components/ui/Reveal'
import Button from '@/components/ui/Button'
import CallAgent from '@/components/CallAgent'
import AgentVideo from '@/components/AgentVideo'

export function generateMetadata() {
  return createMetadata({
    title: 'AI Agents: Leesa, Max & Sally',
    description:
      'Meet the AI phone agents at High Desert Property Management. Leesa (leasing), Max (24/7 maintenance), and Sally (general questions) answer calls when our team is busy or after hours — so owners and residents in Central Oregon always reach a helpful voice, with a real person following up.',
    path: '/ai-agents',
  })
}

const whyPoints = [
  {
    title: 'Nobody waits on hold',
    body: 'When our team is already on another call, an AI agent picks up instead of sending you to voicemail. You get real answers in the moment, not a callback tomorrow.',
  },
  {
    title: 'After hours, still answered',
    body: 'Evenings, weekends, holidays — our agents are the primary responders when the office is closed, so a leasing question or a maintenance issue never has to sit until morning.',
  },
  {
    title: 'Emergencies, 24/7',
    body: 'Max handles maintenance around the clock. A burst pipe at 2am gets logged and moving right away, then routed to the right on-call person.',
  },
  {
    title: 'Our people focus on what matters',
    body: 'By absorbing overflow and routine questions, the agents free our Central Oregon team to spend their time on the work that genuinely needs a human.',
  },
]

const howSteps = [
  {
    step: '1',
    title: 'You call as usual',
    body: 'Dial any of our numbers. If a team member is free, they answer. If everyone’s on another call — or it’s after hours — an AI agent answers instead of voicemail.',
  },
  {
    step: '2',
    title: 'The agent helps and routes',
    body: 'Each agent has a focus: Leesa for leasing, Max for maintenance, Sally for general questions. Sally can hand you off to Leesa or Max when your question is specific.',
  },
  {
    step: '3',
    title: 'A human follows up',
    body: 'Every conversation is logged with the details, so the right person on our team can follow up as fast as possible — the AI never replaces the human, it makes sure the human has what they need.',
  },
]

const faqs = [
  {
    question: 'Are Leesa, Max, and Sally real people?',
    answer:
      'No — they’re AI phone agents built by High Desert Property Management. We’re upfront about that. They answer calls when our team is on another line or the office is closed, and a real person always follows up.',
  },
  {
    question: 'What can the AI agents actually do?',
    answer:
      'Leesa can tell you what’s available, walk you through an application, and schedule a tour. Max can log routine and emergency maintenance requests. Sally answers general questions and routes you to the right place.',
  },
  {
    question: 'Will a human still follow up?',
    answer:
      'Yes. The agents capture the details of every call and hand them to our team so a person can follow up quickly. The AI is there to make sure you’re never left waiting — not to replace our people.',
  },
  {
    question: 'Are the agents available 24/7?',
    answer:
      'Max, our maintenance agent, is available around the clock because maintenance emergencies don’t wait for business hours. Leesa and Max both handle daytime overflow and are the primary responders after hours; Sally covers general questions on the same basis.',
  },
]

export default function AiAgentsPage() {
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'AI Agents', url: `${SITE_URL}/ai-agents` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }} />

      {/* Hero */}
      <ScrollHero className="relative flex min-h-[70vh] items-center bg-primary text-white">
        <Image
          src="/agents/ai-voice-workspace.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[65%_center] lg:object-center"
        />
        <div className="absolute inset-0 bg-black/55 lg:bg-transparent lg:bg-gradient-to-r lg:from-black/65 lg:via-black/30 lg:to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-light">
              Powered by AI · Backed by our team
            </span>
            <h1 className="mt-5 font-heading text-display-sm font-extrabold text-white sm:text-display">
              The AI agents answering your calls
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-white/90">
              Meet Leesa, Max, and Sally — the AI phone agents at High Desert Property Management. They
              pick up when our team is already on another call and when the office is closed, so owners
              and residents across Central Oregon always reach a helpful voice. A real person always
              follows up.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="#meet" variant="primary" size="lg" withArrow>
                Meet the agents
              </Button>
              <Button href="#why" variant="outline-light" size="lg">
                Why we built them
              </Button>
            </div>
          </Reveal>
        </div>
        </div>
      </ScrollHero>

      {/* Why */}
      <Section tone="white" id="why">
        <Reveal>
          <h2 className="font-heading text-title font-bold text-neutral-dark">Why we use AI agents</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-mid">
            Property management is a people business, and a missed call is a missed chance to help. Our
            AI agents exist for one reason: so you always reach someone — or something — that can move
            your request forward, day or night.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {whyPoints.map((p, i) => (
            <Reveal key={p.title} delay={Math.min(i, 3) * 0.05}>
              <Card className="h-full p-6">
                <h3 className="font-heading text-heading text-neutral-dark">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-mid">{p.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section tone="muted">
        <Reveal>
          <h2 className="font-heading text-title font-bold text-neutral-dark">How the technology works</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-mid">
            Our agents are modern conversational-AI voices connected to our phone lines. They understand
            what you’re calling about, answer in plain language, and capture the details for our team.
            Here’s what a call looks like.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {howSteps.map((s, i) => (
            <Reveal key={s.step} delay={Math.min(i, 3) * 0.05}>
              <Card className="h-full p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-heading font-bold text-white">
                  {s.step}
                </span>
                <h3 className="mt-4 font-heading text-heading text-neutral-dark">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-mid">{s.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Meet the agents */}
      <Section tone="white" id="meet">
        <Reveal>
          <h2 className="font-heading text-title font-bold text-neutral-dark">Meet the agents</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-mid">
            Press play to hear each agent introduce themselves — then call or text whenever you need them.
          </p>
        </Reveal>
        <div className="mt-10 space-y-12">
          {AGENT_LIST.map((agent, i) => (
            <Reveal key={agent.id} delay={Math.min(i, 3) * 0.05}>
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                  <AgentVideo agent={agent} />
                </div>
                <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="flex items-center gap-3">
                    <h3 className="font-heading text-subtitle font-bold text-neutral-dark">{agent.name}</h3>
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-accent-dark">
                      AI {agent.role} Agent
                    </span>
                    {agent.availability === '24/7' && (
                      <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                        24/7
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-lg leading-relaxed text-neutral-mid">{agent.tagline}</p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-mid">
                    {agent.availability === '24/7'
                      ? 'Answers around the clock, plus daytime overflow when the team is tied up.'
                      : 'Answers daytime overflow when the team is on another call, and is the primary responder after hours.'}
                  </p>
                  <div className="mt-6">
                    <CallAgent agent={agent} className="max-w-full" />
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Transparency */}
      <Section tone="muted">
        <Reveal>
          <Card className="mx-auto max-w-3xl p-8 text-center">
            <h2 className="font-heading text-subtitle font-bold text-neutral-dark">
              AI agents — and we tell you so
            </h2>
            <p className="mt-3 leading-relaxed text-neutral-mid">
              We believe in being straight with you: Leesa, Max, and Sally are AI. They’re a way to make
              sure you’re never stuck on hold or sent to voicemail — not a way to hide behind a machine.
              Behind every agent is the same Central Oregon team that’s managed local homes since {FOUNDED_YEAR},
              and a real person always follows up.
            </p>
          </Card>
        </Reveal>
      </Section>

      {/* CTA */}
      <Section tone="dark">
        <div className="grid items-center gap-8 lg:grid-cols-[1.5fr_1fr]">
          <Reveal>
            <h2 className="font-heading text-title font-bold text-white">
              Questions about managing your rental?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-white/80">
              Talk to our team about full-service property management in Bend, Redmond, Sisters, and
              across Central Oregon — or get a free, no-obligation rental analysis.
            </p>
          </Reveal>
          <Reveal delay={0.05} className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button href="/owners#get-started" variant="primary" size="lg" withArrow>
              Get my free rental analysis
            </Button>
            <Button href="/contact" variant="outline-light" size="lg">
              Contact our team
            </Button>
          </Reveal>
        </div>
        <p className="mt-8 text-center text-sm text-white/60">
          Prefer to talk now? <Link href="tel:+15415480383" className="font-semibold text-white underline">Call (541) 548-0383</Link> and Sally will point you the right way.
        </p>
      </Section>
    </>
  )
}
