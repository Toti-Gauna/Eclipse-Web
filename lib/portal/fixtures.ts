/**
 * Synthetic fixtures for the client portal mockup — nothing here is a real client, project,
 * person, document or credential. The company and its people are fictional; Eclipse's side
 * appears by role only (no invented team members). Every screen shows the "Demo" badge and
 * the demo notice next to them.
 *
 * One organization ("Ferretería La Muestra") signed in as its admin, with four projects in
 * different public stages: a website in 2 de 5 · Construcción, a chatbot waiting for the
 * client's approval (4 de 5), automations in Soporte (maintenance plan) and a voice agent
 * En pausa with its reason and next action.
 *
 * Words live in messages (`portal.demo.projects.<id>.…`); see lib/portal/types.ts.
 */
import type { Person, PortalProject } from './types';

/** The fictional organization of the signed-in (demo) client. A proper noun: same in every locale. */
export const PORTAL_COMPANY = 'Ferretería La Muestra';

export const PEOPLE = {
  lucia: { name: 'Lucía Ferro', side: 'client', role: 'clientAdmin' },
  martin: { name: 'Martín Ferro', side: 'client', role: 'clientCollaborator' },
  lead: { side: 'eclipse', role: 'projectLead' },
  dev: { side: 'eclipse', role: 'developer' },
  design: { side: 'eclipse', role: 'designer' },
} as const satisfies Record<string, Person>;

export type PersonId = keyof typeof PEOPLE;

/** Who is "signed in" to the demo: owners equal to this person read as "vos". */
export const PORTAL_VIEWER = 'lucia' satisfies PersonId;

export const PORTAL_PROJECTS: readonly PortalProject[] = [
  {
    id: 'sitio-web',
    code: 'DEMO-01',
    items: ['web-multi'],
    stage: 'build',
    startedOn: '2026-09-15',
    lead: 'lead',
    history: [
      { stage: 'preparation', start: '2026-09-15', end: '2026-09-22' },
      { stage: 'build', start: '2026-09-23' },
    ],
    nextMilestone: { owner: 'dev', due: '2026-10-16' },
    deliveryEstimate: '2026-11-06',
    updates: [
      { id: 'home', date: '2026-10-02', author: 'dev' },
      { id: 'faq', date: '2026-09-29', author: 'lead' },
      { id: 'design', date: '2026-09-25', author: 'design' },
      { id: 'build', date: '2026-09-23', author: 'lead', stageChange: { from: 'preparation', to: 'build' } },
      { id: 'inputs', date: '2026-09-19', author: 'lead' },
      { id: 'start', date: '2026-09-15', author: 'lead', stageChange: { from: null, to: 'preparation' } },
    ],
    scope: {
      version: '1.0',
      approvedOn: '2026-09-15',
      items: ['pages', 'responsive', 'catalog', 'contact', 'branches', 'seo'],
    },
    changes: [
      { id: 'pdf', status: 'evaluating', requestedOn: '2026-10-02', requestedBy: 'lucia' },
      { id: 'faq', status: 'accepted', requestedOn: '2026-09-25', requestedBy: 'lucia', decidedOn: '2026-09-29' },
    ],
    documents: [
      { id: 'faq', category: 'decision', version: '1.0', date: '2026-09-29', author: 'lead' },
      { id: 'sitemap', category: 'deliverable', version: '1.1', date: '2026-09-24', author: 'design' },
      { id: 'kickoff', category: 'record', version: '1.0', date: '2026-09-23', author: 'lead' },
      { id: 'assets', category: 'input', version: '2', date: '2026-09-19', author: 'martin' },
      { id: 'proposal', category: 'proposal', version: '1.0', date: '2026-09-15', author: 'lead' },
    ],
  },
  {
    id: 'chatbot',
    code: 'DEMO-02',
    items: ['chatbot'],
    stage: 'clientReview',
    startedOn: '2026-08-25',
    lead: 'lead',
    history: [
      { stage: 'preparation', start: '2026-08-25', end: '2026-08-29' },
      { stage: 'build', start: '2026-09-01', end: '2026-09-19' },
      { stage: 'eclipseReview', start: '2026-09-22', end: '2026-09-29' },
      { stage: 'clientReview', start: '2026-09-30' },
    ],
    nextMilestone: { owner: 'lucia', due: '2026-10-07' },
    action: { kind: 'approve', requestedOn: '2026-09-30' },
    deliveryEstimate: '2026-10-14',
    updates: [
      { id: 'estimate', date: '2026-10-01', author: 'lead' },
      { id: 'review', date: '2026-09-30', author: 'lead', stageChange: { from: 'eclipseReview', to: 'clientReview' } },
      { id: 'tone', date: '2026-09-26', author: 'design' },
      { id: 'qa', date: '2026-09-22', author: 'dev', stageChange: { from: 'build', to: 'eclipseReview' } },
      { id: 'build', date: '2026-09-01', author: 'lead', stageChange: { from: 'preparation', to: 'build' } },
      { id: 'start', date: '2026-08-25', author: 'lead', stageChange: { from: null, to: 'preparation' } },
    ],
    scope: {
      version: '1.0',
      approvedOn: '2026-08-25',
      items: ['channels', 'topics', 'handoff', 'report'],
    },
    changes: [{ id: 'orders', status: 'estimated', requestedOn: '2026-09-24', requestedBy: 'lucia' }],
    documents: [
      { id: 'estimate', category: 'decision', version: '1.0', date: '2026-10-01', author: 'lead' },
      { id: 'answers', category: 'deliverable', version: '3', date: '2026-09-30', author: 'design' },
      { id: 'qa', category: 'record', version: '1.0', date: '2026-09-29', author: 'dev' },
      { id: 'proposal', category: 'proposal', version: '1.0', date: '2026-08-25', author: 'lead' },
    ],
  },
  {
    id: 'recordatorios',
    code: 'DEMO-03',
    items: ['automatizacion'],
    maintenance: 'esencial',
    stage: 'support',
    startedOn: '2026-07-06',
    lead: 'lead',
    history: [
      { stage: 'preparation', start: '2026-07-06', end: '2026-07-10' },
      { stage: 'build', start: '2026-07-13', end: '2026-07-31' },
      { stage: 'eclipseReview', start: '2026-08-03', end: '2026-08-05' },
      { stage: 'clientReview', start: '2026-08-06', end: '2026-08-07' },
      { stage: 'delivery', start: '2026-08-10', end: '2026-08-11' },
      { stage: 'support', start: '2026-08-12' },
    ],
    nextMilestone: { owner: 'dev', due: '2026-11-02' },
    updates: [
      { id: 'september', date: '2026-10-01', author: 'dev' },
      { id: 'restock', date: '2026-09-08', author: 'lead' },
      { id: 'august', date: '2026-09-01', author: 'dev' },
      { id: 'support', date: '2026-08-12', author: 'lead', stageChange: { from: 'delivery', to: 'support' } },
      { id: 'delivery', date: '2026-08-10', author: 'lead', stageChange: { from: 'clientReview', to: 'delivery' } },
      { id: 'start', date: '2026-07-06', author: 'lead', stageChange: { from: null, to: 'preparation' } },
    ],
    scope: {
      version: '1.0',
      approvedOn: '2026-07-06',
      items: ['pickup', 'ready', 'survey', 'report'],
    },
    changes: [
      { id: 'restock', status: 'accepted', requestedOn: '2026-09-04', requestedBy: 'lucia', decidedOn: '2026-09-08' },
    ],
    documents: [
      { id: 'september', category: 'deliverable', version: '1.0', date: '2026-10-01', author: 'dev' },
      { id: 'manual', category: 'manual', version: '1.0', date: '2026-08-11', author: 'design' },
      { id: 'handover', category: 'record', version: '1.0', date: '2026-08-11', author: 'lead' },
      { id: 'proposal', category: 'proposal', version: '1.0', date: '2026-07-06', author: 'lead' },
    ],
  },
  {
    id: 'agente-voz',
    code: 'DEMO-04',
    items: ['voz'],
    stage: 'paused',
    pausedIn: 'build',
    pause: { since: '2026-09-24', owner: 'lucia' },
    startedOn: '2026-09-01',
    lead: 'lead',
    history: [
      { stage: 'preparation', start: '2026-09-01', end: '2026-09-04' },
      { stage: 'build', start: '2026-09-07' },
    ],
    nextMilestone: { owner: 'lucia', due: '2026-10-09' },
    action: { kind: 'confirm', requestedOn: '2026-09-24' },
    updates: [
      { id: 'paused', date: '2026-09-24', author: 'lead', stageChange: { from: 'build', to: 'paused' } },
      { id: 'calls', date: '2026-09-18', author: 'dev' },
      { id: 'build', date: '2026-09-07', author: 'lead', stageChange: { from: 'preparation', to: 'build' } },
      { id: 'start', date: '2026-09-01', author: 'lead', stageChange: { from: null, to: 'preparation' } },
    ],
    scope: {
      version: '1.0',
      approvedOn: '2026-09-01',
      items: ['calls', 'parallel', 'confirm', 'summary'],
    },
    changes: [],
    documents: [
      { id: 'script', category: 'deliverable', version: '2', date: '2026-09-18', author: 'dev' },
      { id: 'proposal', category: 'proposal', version: '1.0', date: '2026-09-01', author: 'lead' },
    ],
  },
];
