import { z } from 'zod';

/**
 * Returns true when a URL hostname targets a private/internal host and must be
 * rejected to prevent SSRF (localhost, loopback, RFC-1918, link-local, 0.0.0.0).
 */
export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host === '0.0.0.0') return true;
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

function isParsableDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

const validDateString = z.string().refine(isParsableDate, {
  message: 'Must be a valid parsable date string',
});

export const DealTypeEnum = z.enum([
  'equity_investment',
  'debt_credit_facility',
  'cloud_compute_contract',
  'infrastructure_project_finance',
  'power_purchase_agreement',
  'acquisition',
  'strategic_partnership',
  'equipment_purchase',
  'other',
]);

export const DealStatusEnum = z.enum([
  'proposed',
  'announced',
  'signed',
  'closed',
  'active',
  'cancelled',
  'expired',
  'disputed',
  'unknown',
]);

export const EvidenceLevelEnum = z.enum([
  'confirmed_primary',
  'reported_secondary',
  'announced_not_completed',
  'estimated',
  'disputed',
  'superseded',
]);

export const AmountBasisEnum = z.enum([
  'cash_investment',
  'credit_facility',
  'contract_value',
  'commitment',
  'project_cost',
  'gpu_collateralized_loan',
  'equity_valuation',
  'other',
]);

export const DealPartyRoleEnum = z.enum([
  'investor',
  'investee',
  'borrower',
  'lender',
  'customer',
  'supplier',
  'cloud_provider',
  'project_owner',
  'guarantor',
  'utility',
  'partner',
  'counterparty',
  'other',
]);

export const SourceCitationSchema = z.object({
  source_id: z.string().uuid().optional(),
  url: z
    .string()
    .url('Must be a valid HTTP or HTTPS URL')
    .refine(
      (val) => {
        try {
          const parsed = new URL(val);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
          return !isBlockedHostname(parsed.hostname.toLowerCase());
        } catch {
          return false;
        }
      },
      { message: 'URL points to a private/internal host and is not allowed' }
    ),
  title: z.string().min(3, 'Source title is required'),
  publisher: z.string().optional(),
  source_type: z.enum([
    'primary_filing',
    'company_release',
    'government_data',
    'regulator_document',
    'reputable_media',
    'research_report',
    'other',
  ]),
  published_date: validDateString.optional().nullable(),
  supporting_note: z.string().min(5, 'Specific supporting note explaining what fact this source verifies is required'),
  is_primary_support: z.boolean().default(false),
});

export const DealFormSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().min(5, 'Title must be at least 5 characters long'),
    slug: z
      .string()
      .min(3)
      .max(120, 'Slug must be at most 120 characters long')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-case alphanumeric with dashes'),
    summary: z.string().min(20, 'Neutral factual summary must be at least 20 characters'),
    deal_type: DealTypeEnum,
    status: DealStatusEnum,
    announcement_date: validDateString.optional().nullable(),
    effective_date: validDateString.optional().nullable(),
    maturity_date: validDateString.optional().nullable(),
    amount_value: z.number().positive().optional().nullable(),
    amount_currency: z
      .string()
      .regex(/^[A-Z]{3}$/, 'Currency must be 3 uppercase letters (e.g. USD, EUR)')
      .default('USD'),
    amount_basis: AmountBasisEnum.optional().nullable(),
    amount_period: z.string().optional().nullable(),
    amount_disclosed: z.boolean().default(false),
    geography: z.string().optional().nullable(),
    evidence_level: EvidenceLevelEnum,
    confidence_note: z.string().optional().nullable(),
    is_published: z.boolean().default(false),
    parties: z.array(
      z.object({
        company_id: z.string().uuid('Company ID must be a valid UUID'),
        role: DealPartyRoleEnum,
        direction_note: z.string().optional().nullable(),
      })
    ).min(2, 'A deal requires at least two counterparties'),
    sources: z.array(SourceCitationSchema),
  })
  .superRefine((data, ctx) => {
    // Publish integrity check: Published deal MUST have at least one source citation
    if (data.is_published && (!data.sources || data.sources.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sources'],
        message: 'A published deal requires at least one verified source citation.',
      });
    }

    // Amount disclosed integrity check: if amount_disclosed is false, amount_value should be null
    if (!data.amount_disclosed && data.amount_value !== null && data.amount_value !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['amount_value'],
        message: 'Undisclosed deals cannot have a fabricated amount value.',
      });
    }

    // Chronological date integrity checks
    if (data.announcement_date && data.effective_date) {
      if (new Date(data.effective_date) < new Date(data.announcement_date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['effective_date'],
          message: 'Effective date cannot be prior to announcement date.',
        });
      }
    }

    if (data.effective_date && data.maturity_date) {
      if (new Date(data.maturity_date) < new Date(data.effective_date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['maturity_date'],
          message: 'Maturity date cannot be prior to effective date.',
        });
      }
    }

    // Duplicate counterparty check: same company_id + role must not repeat
    if (data.parties && data.parties.length > 0) {
      const seen = new Set<string>();
      data.parties.forEach((party, index) => {
        const key = `${party.company_id}::${party.role}`;
        if (seen.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['parties', index, 'company_id'],
            message: 'Duplicate counterparty: same company and role appears more than once.',
          });
        } else {
          seen.add(key);
        }
      });
    }

    // Estimated/disputed evidence requires an explanatory confidence note
    if (
      (data.evidence_level === 'estimated' || data.evidence_level === 'disputed') &&
      (!data.confidence_note || data.confidence_note.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confidence_note'],
        message: 'A confidence note is required when evidence is estimated or disputed.',
      });
    }
  });

export type DealFormData = z.infer<typeof DealFormSchema>;
