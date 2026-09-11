import { describe, expect, it } from 'vitest'
import {
  AUTOMATION_TEMPLATES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_ORDER,
  getTemplate,
  type TemplateSlug,
} from './templates'
import {
  validateStepsForActivation,
  validateTriggerForActivation,
} from './validate'
import { validateInteractivePayload } from '../whatsapp/interactive'

describe('AUTOMATION_TEMPLATES library', () => {
  it('has consistent definitions in TEMPLATE_ORDER', () => {
    expect(TEMPLATE_ORDER.length).toBeGreaterThanOrEqual(10)
    for (const slug of TEMPLATE_ORDER) {
      const t = AUTOMATION_TEMPLATES[slug]
      expect(t, `Missing template for slug ${slug}`).toBeDefined()
      expect(t.slug).toBe(slug)
      expect(t.name.trim().length).toBeGreaterThan(0)
      expect(t.description.trim().length).toBeGreaterThan(0)
      expect(t.badge.trim().length).toBeGreaterThan(0)
      expect(t.iconName.trim().length).toBeGreaterThan(0)
      expect(t.highlights.length).toBeGreaterThan(0)
      expect(t.steps.length).toBeGreaterThan(0)
    }
  })

  it('assigns valid categories matching TEMPLATE_CATEGORIES', () => {
    const validCats = new Set(TEMPLATE_CATEGORIES.map((c) => c.id))
    for (const slug of TEMPLATE_ORDER) {
      const t = AUTOMATION_TEMPLATES[slug]
      expect(validCats.has(t.category)).toBe(true)
    }
  })

  it('validates triggers for all templates without activation issues', () => {
    for (const slug of TEMPLATE_ORDER) {
      const t = AUTOMATION_TEMPLATES[slug]
      const triggerIssues = validateTriggerForActivation(
        t.trigger_type,
        t.trigger_config,
      )
      expect(
        triggerIssues,
        `Template "${t.name}" (${slug}) trigger validation failed: ${JSON.stringify(
          triggerIssues,
        )}`,
      ).toEqual([])
    }
  })

  it('validates all template steps for activation with zero issues', () => {
    for (const slug of TEMPLATE_ORDER) {
      const t = AUTOMATION_TEMPLATES[slug]

      // Reconstruct nested step tree matching builder structure for validation
      interface StepNode {
        step_type: string
        step_config: Record<string, unknown>
        branches?: { yes?: StepNode[]; no?: StepNode[] }
      }

      const nodes: StepNode[] = t.steps.map((s) => ({
        step_type: s.step_type,
        step_config: s.step_config as Record<string, unknown>,
        branches:
          s.step_type === 'condition' ? { yes: [], no: [] } : undefined,
      }))

      const rootNodes: StepNode[] = []
      t.steps.forEach((s, idx) => {
        if (s.parent_index == null) {
          rootNodes.push(nodes[idx])
        } else {
          const parent = nodes[s.parent_index]
          if (!parent.branches) parent.branches = { yes: [], no: [] }
          parent.branches[s.branch ?? 'yes']!.push(nodes[idx])
        }
      })

      const issues = validateStepsForActivation(rootNodes)
      expect(
        issues,
        `Template "${t.name}" (${slug}) step validation failed: ${JSON.stringify(
          issues,
        )}`,
      ).toEqual([])
    }
  })

  it('validates interactive payload structures against Meta limits', () => {
    for (const slug of TEMPLATE_ORDER) {
      const t = AUTOMATION_TEMPLATES[slug]
      for (const step of t.steps) {
        if (
          step.step_type === 'send_buttons' ||
          step.step_type === 'send_list'
        ) {
          const res = validateInteractivePayload(step.step_config)
          expect(
            res.ok,
            `Interactive payload in template "${slug}" failed: ${
              res.ok ? '' : res.error
            }`,
          ).toBe(true)
        }
      }
    }
  })

  it('retrieves templates via getTemplate helper', () => {
    expect(getTemplate('company_concierge')).toBeDefined()
    expect(getTemplate('company_concierge')?.slug).toBe('company_concierge')
    expect(getTemplate('unknown_slug_test')).toBeNull()
  })
})
