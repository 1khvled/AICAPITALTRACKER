import { z } from 'zod';

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
  url: z.string().url('Must be a valid HTTP or HTTPS URL'),
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
  published_date: z.string().optional().nullable(),
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
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-case alphanumeric with dashes'),
    summary: z.string().min(20, 'Neutral factual summary must be at least 20 characters'),
    deal_type: DealTypeEnum,
    status: DealStatusEnum,
    announcement_date: z.string().optional().nullable(),
    effective_date: z.string().optional().nullable(),
    maturity_date: z.string().optional().nullable(),
    amount_value: z.number().positive().optional().nullable(),
    amount_currency: z.string().length(3).default('USD'),
    amount_basis: AmountBasisEnum.optional().nullable(),
    amount_period: z.string().optional().nullable(),
    amount_disclosed: z.boolean().default(false),
    geography: z.string().optional().nullable(),
    evidence_level: EvidenceLevelEnum,
    confidence_note: z.string().optional().nullable(),
    is_published: z.boolean().default(false),
    parties: z.array(
      z.object({
        company_id: z.string().min(1, 'Company selection is required'),
        role: DealPartyRoleEnum,
        direction_note: z.string().optional().nullable(),
      })
    ).min(1, 'At least one counterparty must be associated with the deal'),
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
  });

export type DealFormData = z.infer<typeof DealFormSchema>;
