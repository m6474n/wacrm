import type {
  AutomationStepConfig,
  AutomationStepType,
  AutomationTriggerConfig,
  AutomationTriggerType,
} from '@/types'

export type TemplateSlug =
  | 'company_concierge'
  | 'services_catalog'
  | 'about_company'
  | 'business_hours_location'
  | 'department_router'
  | 'lead_quote_bot'
  | 'appointment_booking'
  | 'faq_knowledge_bot'
  | 'csat_feedback_survey'
  | 'out_of_office'
  | 'follow_up_reminder'
  | 'welcome_message'
  // Backward compatibility alias:
  | 'lead_qualifier'

export type TemplateCategory =
  | 'company_info'
  | 'support'
  | 'sales'
  | 'feedback'

export interface TemplateStepSeed {
  step_type: AutomationStepType
  step_config: AutomationStepConfig
  branch?: 'yes' | 'no' | null
  /** Index (within this seed list) of the Condition parent, if nested. */
  parent_index?: number | null
}

export interface AutomationTemplateDefinition {
  slug: TemplateSlug
  name: string
  description: string
  category: TemplateCategory
  badge: string
  iconName: string
  highlights: string[]
  trigger_type: AutomationTriggerType
  trigger_config: AutomationTriggerConfig
  steps: TemplateStepSeed[]
}

export const TEMPLATE_CATEGORIES: { id: TemplateCategory | 'all'; labelKey: string }[] = [
  { id: 'all', labelKey: 'all' },
  { id: 'company_info', labelKey: 'companyInfo' },
  { id: 'support', labelKey: 'support' },
  { id: 'sales', labelKey: 'sales' },
  { id: 'feedback', labelKey: 'feedback' },
]

export const TEMPLATE_ORDER: TemplateSlug[] = [
  'company_concierge',
  'services_catalog',
  'about_company',
  'business_hours_location',
  'department_router',
  'lead_quote_bot',
  'appointment_booking',
  'faq_knowledge_bot',
  'csat_feedback_survey',
  'out_of_office',
  'follow_up_reminder',
  'welcome_message',
]

export const AUTOMATION_TEMPLATES: Record<TemplateSlug, AutomationTemplateDefinition> = {
  company_concierge: {
    slug: 'company_concierge',
    name: 'Company Concierge & Interactive Menu',
    description:
      'Interactive main menu bot presenting your company services, about details, office hours, and human agent routing without AI.',
    category: 'company_info',
    badge: 'Interactive Menu',
    iconName: 'Compass',
    highlights: ['5 Menu Options', 'Zero AI Required', 'Instant Navigation'],
    trigger_type: 'first_inbound_message',
    trigger_config: {},
    steps: [
      {
        step_type: 'send_list',
        step_config: {
          kind: 'list',
          header: '🏢 Welcome to Our Business',
          body:
            '👋 Hello! Welcome to our automated concierge. How can we help you today? Please choose an option from our menu below:',
          footer: 'Tap below to open menu',
          button_label: 'Main Menu 📋',
          sections: [
            {
              title: 'Explore Our Business',
              rows: [
                {
                  id: 'menu_services',
                  title: '💼 Our Services',
                  description: 'Explore our solutions, packages & pricing',
                },
                {
                  id: 'menu_about',
                  title: '🏢 About Our Company',
                  description: 'Who we are, our track record & mission',
                },
                {
                  id: 'menu_hours',
                  title: '📍 Hours & Location',
                  description: 'Office address, directions & open hours',
                },
              ],
            },
            {
              title: 'Get in Touch',
              rows: [
                {
                  id: 'menu_quote',
                  title: '📝 Request a Quote',
                  description: 'Get a quick price estimate for your project',
                },
                {
                  id: 'menu_support',
                  title: '👨‍💼 Speak to an Agent',
                  description: 'Connect live with our customer support team',
                },
              ],
            },
          ],
        },
      },
    ],
  },

  services_catalog: {
    slug: 'services_catalog',
    name: 'Services & Solutions Showcase',
    description:
      'Interactive service catalog showcasing packages, consulting, custom implementations, and quick quote requests.',
    category: 'company_info',
    badge: 'Service Catalog',
    iconName: 'Briefcase',
    highlights: ['Interactive List', 'Package Breakdown', 'Quote Trigger'],
    trigger_type: 'interactive_reply',
    trigger_config: {
      reply_ids: ['menu_services', 'view_services', 'services_btn'],
    },
    steps: [
      {
        step_type: 'send_list',
        step_config: {
          kind: 'list',
          header: '💼 Our Services & Solutions',
          body:
            'Explore our core offerings below. Select any service to view full package details and options:',
          footer: 'Select a service to view',
          button_label: 'View Services 📂',
          sections: [
            {
              title: 'Core Offerings',
              rows: [
                {
                  id: 'svc_consulting',
                  title: '1. Strategy Consulting',
                  description: 'Custom strategy, audits & expert roadmaps',
                },
                {
                  id: 'svc_development',
                  title: '2. Custom Development',
                  description: 'End-to-end software, web & mobile builds',
                },
                {
                  id: 'svc_support',
                  title: '3. Care & Maintenance',
                  description: '24/7 monitoring, security & ongoing care',
                },
              ],
            },
            {
              title: 'Action & Next Steps',
              rows: [
                {
                  id: 'menu_quote',
                  title: '💰 Custom Quote',
                  description: 'Request customized pricing for your requirements',
                },
                {
                  id: 'menu_support',
                  title: '💬 Solution Expert',
                  description: 'Ask technical questions with our specialists',
                },
              ],
            },
          ],
        },
      },
    ],
  },

  about_company: {
    slug: 'about_company',
    name: 'About Company & Credentials',
    description:
      'Interactive business profile highlighting years in business, client milestones, website URL, and quick action buttons.',
    category: 'company_info',
    badge: 'Company Details',
    iconName: 'Building2',
    highlights: ['Interactive Buttons', 'Website Link', 'Instant Credibility'],
    trigger_type: 'interactive_reply',
    trigger_config: {
      reply_ids: ['menu_about', 'about_us', 'company_info'],
    },
    steps: [
      {
        step_type: 'send_buttons',
        step_config: {
          kind: 'buttons',
          header: '🏢 About Our Company',
          body:
            '🌟 We help businesses transform and scale with modern technology.\n\n✨ Why partner with us:\n• 10+ years of proven delivery\n• 500+ happy clients worldwide\n• 99.8% customer satisfaction score\n\n🌐 Website: https://example.com\n📧 Email: info@example.com',
          footer: 'Delivering excellence since 2015',
          buttons: [
            { id: 'menu_services', title: '💼 Our Services' },
            { id: 'menu_hours', title: '📍 Hours & Office' },
            { id: 'menu_support', title: '💬 Talk to Us' },
          ],
        },
      },
    ],
  },

  business_hours_location: {
    slug: 'business_hours_location',
    name: 'Business Hours & Office Location',
    description:
      'Provide operating hours, headquarters address, phone numbers, parking directions, and quick navigation buttons.',
    category: 'company_info',
    badge: 'Hours & Location',
    iconName: 'MapPin',
    highlights: ['Office Timings', 'Headquarters Address', 'Direct Hotline'],
    trigger_type: 'interactive_reply',
    trigger_config: {
      reply_ids: ['menu_hours', 'hours_btn', 'location_btn'],
    },
    steps: [
      {
        step_type: 'send_buttons',
        step_config: {
          kind: 'buttons',
          header: '📍 Office & Working Hours',
          body:
            '🕒 Business Hours:\n• Monday – Friday: 9:00 AM – 6:00 PM\n• Saturday: 10:00 AM – 2:00 PM\n• Sunday: Closed\n\n🏢 Main Office:\n123 Innovation Way, Suite 400\nTech City, NY 10001\n\n📞 Phone: +1 (555) 019-2830\n🚗 Free parking available on site.',
          footer: 'Appointments & walk-ins welcome',
          buttons: [
            { id: 'menu_support', title: '💬 Speak to Human' },
            { id: 'menu_main', title: '🏠 Main Menu' },
          ],
        },
      },
    ],
  },

  department_router: {
    slug: 'department_router',
    name: 'Department Router & Human Handoff',
    description:
      'Route inbound customers to Sales, Technical Support, or Billing, then round-robin assign to live agents.',
    category: 'support',
    badge: 'Human Handoff',
    iconName: 'Users',
    highlights: ['Department Buttons', 'Round-Robin Assign', 'Live Routing'],
    trigger_type: 'interactive_reply',
    trigger_config: {
      reply_ids: ['menu_support', 'talk_to_agent', 'human_agent'],
    },
    steps: [
      {
        step_type: 'send_buttons',
        step_config: {
          kind: 'buttons',
          header: '👨‍💼 Live Department Router',
          body:
            'Connecting you to our team! To direct your conversation to the right specialist, please choose your department below:',
          footer: 'Average response time: < 5 min',
          buttons: [
            { id: 'dept_sales', title: '💰 Sales & Quotes' },
            { id: 'dept_support', title: '🛠️ Tech Support' },
            { id: 'dept_billing', title: '💳 Billing & Admin' },
          ],
        },
      },
      {
        step_type: 'assign_conversation',
        step_config: { mode: 'round_robin' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text:
            'Thank you! An agent has been assigned to your conversation and will assist you shortly. If this is an urgent matter, please share your details.',
        },
      },
    ],
  },

  lead_quote_bot: {
    slug: 'lead_quote_bot',
    name: 'Interactive Lead & Quote Requester',
    description:
      'Qualify prospective customers by asking for their team or project size using interactive buttons, then assign to sales.',
    category: 'sales',
    badge: 'Lead Capture',
    iconName: 'Sparkles',
    highlights: ['Interactive Sizing', 'Sales Hand-off', 'Keyword Trigger'],
    trigger_type: 'keyword_match',
    trigger_config: {
      keywords: ['pricing', 'quote', 'estimate', 'cost', 'buy'],
      match_type: 'contains',
    },
    steps: [
      {
        step_type: 'send_buttons',
        step_config: {
          kind: 'buttons',
          header: '📝 Instant Quote Request',
          body:
            "We'd love to help with pricing! To give you an accurate estimate, how large is your team or project scope?",
          footer: 'Select one option to continue',
          buttons: [
            { id: 'quote_small', title: '🌱 Starter (1-10)' },
            { id: 'quote_mid', title: '🏢 Growth (11-50)' },
            { id: 'quote_ent', title: '🚀 Enterprise (50+)' },
          ],
        },
      },
      {
        step_type: 'wait',
        step_config: { amount: 5, unit: 'minutes' },
      },
      {
        step_type: 'assign_conversation',
        step_config: { mode: 'round_robin' },
      },
    ],
  },

  // Alias for backward compatibility
  lead_qualifier: {
    slug: 'lead_qualifier',
    name: 'Interactive Lead & Quote Requester',
    description:
      'Qualify prospective customers by asking for their team or project size using interactive buttons, then assign to sales.',
    category: 'sales',
    badge: 'Lead Capture',
    iconName: 'Sparkles',
    highlights: ['Interactive Sizing', 'Sales Hand-off', 'Keyword Trigger'],
    trigger_type: 'keyword_match',
    trigger_config: {
      keywords: ['pricing', 'quote', 'estimate', 'cost', 'buy'],
      match_type: 'contains',
    },
    steps: [
      {
        step_type: 'send_buttons',
        step_config: {
          kind: 'buttons',
          header: '📝 Instant Quote Request',
          body:
            "We'd love to help with pricing! To give you an accurate estimate, how large is your team or project scope?",
          footer: 'Select one option to continue',
          buttons: [
            { id: 'quote_small', title: '🌱 Starter (1-10)' },
            { id: 'quote_mid', title: '🏢 Growth (11-50)' },
            { id: 'quote_ent', title: '🚀 Enterprise (50+)' },
          ],
        },
      },
      {
        step_type: 'wait',
        step_config: { amount: 5, unit: 'minutes' },
      },
      {
        step_type: 'assign_conversation',
        step_config: { mode: 'round_robin' },
      },
    ],
  },

  appointment_booking: {
    slug: 'appointment_booking',
    name: 'Consultation & Demo Scheduler',
    description:
      'Offer consultation formats (Demo, Strategy Call, Technical Q&A) via buttons and send self-scheduling calendar links.',
    category: 'sales',
    badge: 'Booking',
    iconName: 'CalendarCheck',
    highlights: ['Session Formats', 'Calendar Integration', 'Instant Confirmation'],
    trigger_type: 'keyword_match',
    trigger_config: {
      keywords: ['book', 'appointment', 'demo', 'schedule', 'meeting'],
      match_type: 'contains',
    },
    steps: [
      {
        step_type: 'send_buttons',
        step_config: {
          kind: 'buttons',
          header: '📅 Schedule a Consultation',
          body:
            "Book a 1-on-1 consultation with our team! Select the session format that works best for you:",
          footer: 'Free 1-on-1 session',
          buttons: [
            { id: 'book_demo', title: '🎯 15-min Demo' },
            { id: 'book_strategy', title: '💡 Strategy Call' },
            { id: 'book_tech', title: '⚙️ Tech Review' },
          ],
        },
      },
      {
        step_type: 'send_message',
        step_config: {
          text:
            'Great! Pick a time that fits your calendar here:\n🔗 https://calendly.com/your-company/consultation\n\nWe look forward to meeting with you!',
        },
      },
    ],
  },

  faq_knowledge_bot: {
    slug: 'faq_knowledge_bot',
    name: 'FAQ & Knowledge Base Menu',
    description:
      'Provide instant answers to common questions regarding payment terms, delivery timelines, SLAs, and security.',
    category: 'support',
    badge: 'Self-Service',
    iconName: 'HelpCircle',
    highlights: ['Multi-Topic List', 'Instant Answers', 'Support Fallback'],
    trigger_type: 'keyword_match',
    trigger_config: {
      keywords: ['faq', 'questions', 'help', 'shipping', 'policy'],
      match_type: 'contains',
    },
    steps: [
      {
        step_type: 'send_list',
        step_config: {
          kind: 'list',
          header: '❓ Frequently Asked Questions',
          body:
            'Need quick answers? Select a question topic from our self-service knowledge base below:',
          footer: 'Instant automated answers',
          button_label: 'Browse FAQs 📖',
          sections: [
            {
              title: 'Help & Policies',
              rows: [
                {
                  id: 'faq_payments',
                  title: '💳 Payment & Billing',
                  description: 'Accepted payment methods, invoicing & refunds',
                },
                {
                  id: 'faq_timeline',
                  title: '⏱️ Delivery Timeline',
                  description: 'Typical turnaround times and milestones',
                },
                {
                  id: 'faq_support',
                  title: '🛠️ Support & SLAs',
                  description: 'Support channels, coverage hours and response time',
                },
                {
                  id: 'faq_security',
                  title: '🔒 Security & Privacy',
                  description: 'Data encryption, compliance and privacy terms',
                },
              ],
            },
            {
              title: 'Still Need Help?',
              rows: [
                {
                  id: 'menu_support',
                  title: '👨‍💼 Talk to an Agent',
                  description: 'Connect directly with our support team',
                },
              ],
            },
          ],
        },
      },
    ],
  },

  csat_feedback_survey: {
    slug: 'csat_feedback_survey',
    name: 'Customer Satisfaction (CSAT) Survey',
    description:
      'Collect immediate customer satisfaction ratings with 5-star interactive rating buttons.',
    category: 'feedback',
    badge: 'CSAT Survey',
    iconName: 'Star',
    highlights: ['5-Star Rating', '5-Second Survey', 'Automated Thank You'],
    trigger_type: 'interactive_reply',
    trigger_config: {
      reply_ids: ['rate_service', 'csat_survey', 'give_feedback'],
    },
    steps: [
      {
        step_type: 'send_buttons',
        step_config: {
          kind: 'buttons',
          header: '⭐ Quick Feedback',
          body:
            'Your feedback matters to us! How would you rate your recent experience with our company?',
          footer: 'Takes 5 seconds to answer',
          buttons: [
            { id: 'csat_excellent', title: '⭐⭐⭐⭐⭐ Excellent' },
            { id: 'csat_good', title: '⭐⭐⭐ Good' },
            { id: 'csat_poor', title: '⭐ Needs Work' },
          ],
        },
      },
      {
        step_type: 'send_message',
        step_config: {
          text:
            'Thank you for taking the time to share your feedback! We truly appreciate your support.',
        },
      },
    ],
  },

  out_of_office: {
    slug: 'out_of_office',
    name: 'Out of Office & After Hours Responder',
    description:
      'Auto-reply during off-hours with time-of-day condition and interactive buttons to browse services or report urgent issues.',
    category: 'support',
    badge: 'After Hours',
    iconName: 'Clock',
    highlights: ['Time-of-Day Condition', 'Emergency Option', 'Self-Serve Links'],
    trigger_type: 'new_message_received',
    trigger_config: {},
    steps: [
      {
        step_type: 'condition',
        step_config: {
          subject: 'time_of_day',
          operand: '18:00-09:00',
        },
      },
      {
        step_type: 'send_buttons',
        step_config: {
          kind: 'buttons',
          header: "🌙 We're Currently Away",
          body:
            "Thanks for your message! Our team is currently offline (Office hours: Mon–Fri 9am–6pm). We will respond first thing in the morning.\n\nIn the meantime, feel free to explore our options:",
          buttons: [
            { id: 'menu_services', title: '💼 Our Services' },
            { id: 'menu_hours', title: '📍 Hours & Location' },
            { id: 'urgent_request', title: '🚨 Urgent Inquiry' },
          ],
        },
        parent_index: 0,
        branch: 'yes',
      },
    ],
  },

  follow_up_reminder: {
    slug: 'follow_up_reminder',
    name: 'Follow-Up & Re-engagement Reminder',
    description:
      'Send an automated nudge after 24 hours of inactivity with interactive buttons for next steps.',
    category: 'sales',
    badge: 'Re-engagement',
    iconName: 'PhoneCall',
    highlights: ['24-Hour Wait', 'Quick-Reply Choices', 'Lead Recovery'],
    trigger_type: 'new_message_received',
    trigger_config: {},
    steps: [
      {
        step_type: 'wait',
        step_config: { amount: 1, unit: 'days' },
      },
      {
        step_type: 'send_buttons',
        step_config: {
          kind: 'buttons',
          body:
            "Just checking in! 👋 Did you have any further questions or would you like to discuss next steps? We're ready whenever you are!",
          buttons: [
            { id: 'followup_yes', title: '✅ Ready to Proceed' },
            { id: 'menu_support', title: '💬 Ask a Question' },
            { id: 'followup_later', title: '⏰ Check Later' },
          ],
        },
      },
    ],
  },

  welcome_message: {
    slug: 'welcome_message',
    name: 'Classic Welcome Greeting',
    description: 'Auto-reply to first-time contacts with a friendly greeting.',
    category: 'feedback',
    badge: 'Essential',
    iconName: 'MessageCircle',
    highlights: ['First Inbound Trigger', 'Warm Welcome', 'Instant Response'],
    trigger_type: 'first_inbound_message',
    trigger_config: {},
    steps: [
      {
        step_type: 'send_message',
        step_config: {
          text:
            "Hi! 👋 Thanks for reaching out to us. We're glad to connect with you! Please let us know how we can assist you today.",
        },
      },
    ],
  },
}

export function getTemplate(slug: string): AutomationTemplateDefinition | null {
  return AUTOMATION_TEMPLATES[slug as TemplateSlug] ?? null
}
