// ─────────────────────────────────────────────────────────────────────────────
// The /glossary registry.
//
// One file, one job: define every word this site uses without defining, once,
// so that the guides, the model panels, the ledger and the charts can all
// point at the same explanation instead of each inventing their own.
//
// SERVER-SAFE. No React import, no browser APIs, no state. The registry is a
// plain array of plain objects: the page imports it on the server, hands it to
// the client browser as a prop, and the API layer can read it too.
//
// HOUSE RULES FOR THE TEXT BELOW
//   1. Definitions are GENERIC. A term is defined as the finance and
//      technology industries define it, not as this site happens to score it.
//   2. Where the site uses a term in a specific way, that is said plainly and
//      the `source` field names the file or the published formula it comes
//      from. No source, no claim about the site.
//   3. NO NUMBERS FROM THE LIVE DATA. The live print moves daily; a glossary
//      that quotes it goes stale the moment it is published. Formulas are
//      quoted because they are published and stable — values are not.
//   4. `id` is a permanent anchor. /glossary#cds-spread is a link other sites
//      and other people may already have copied, so an id is never renamed and
//      never reused for a different term.
// ─────────────────────────────────────────────────────────────────────────────

export interface GlossaryTerm {
  /** Stable, URL-safe anchor id: /glossary#<id>. Never renamed. */
  id: string;
  /** The word as the site writes it, capitalised for the heading. */
  term: string;
  /** One line. The definition as it appears in the list. */
  short: string;
  /** The longer explanation: what it measures, and where it breaks. */
  body: string;
  /** Ids of related terms, rendered as links that scroll to the entry. */
  related?: string[];
  /**
   * Where the concept comes from, when that is knowable from this site's own
   * published material: a file in this repository, or a published formula.
   * Omitted when the term is a general piece of finance vocabulary that the
   * site does not define for itself.
   */
  source?: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // ── A ────────────────────────────────────────────────────────────────────
  {
    id: "altman-z-score",
    term: "Altman Z''-score",
    short: "A four-ratio score that sorts a company into a safe, grey or distress zone for bankruptcy.",
    body: "Edward Altman built the score in 1968 for manufacturers and revised it in 2002 for non-manufacturers and technology services, which is the version usually quoted as Z''. It combines working capital, retained earnings, EBIT and the market value of equity against total assets and total liabilities, and the result is read as a zone rather than as a probability: above roughly 2.6 is the safe zone, below 1.1 the distress zone, and between the two is the grey zone, where the model declines to give a verdict. This site computes Z'' for the tracked borrower set and publishes the zone it lands in. One of the four inputs is an assumed equity-to-debt value rather than a figure read off a filing, and the published formula says so rather than hiding it.",
    related: ["distance-to-default", "fragility-index", "minsky-regime"],
    source: "src/lib/model/documentFormulas.ts — MODEL_DOC_FORMULAS.altman_z",
  },

  // ── B ────────────────────────────────────────────────────────────────────
  {
    id: "backlog-share",
    term: "Backlog share",
    short: "The slice of tracked disclosed capital that is announced but has not closed.",
    body: "A financing is announced before it funds, and the gap between those two states is the backlog. Backlog share is the proportion of the ledger's disclosed value sitting in it. It is a timing measure rather than a quality measure: a large backlog can mean the market is committing faster than the plumbing can settle, and it can also mean nothing more than that a slice of the deals are between signature and closing. This site carries the announced-but-unclosed share of the ledger as one leg of the funding velocity factor, and the ledger guide explains why the figure is a share of disclosed capital rather than of the whole market.",
    related: ["mega-deal", "debt-issuance-velocity"],
    source: "src/lib/model/factors.ts — MODEL_FACTORS.funding_velocity",
  },
  {
    id: "brier-score",
    term: "Brier score",
    short: "The mean squared error between a forecast probability and the outcome it was asked about.",
    body: "A probability forecast earns a Brier score of zero when it is exactly right about a certain event and one when it is exactly wrong. A well-calibrated forecaster on a genuine coin-flip scores about 0.25, so a low score is a sign of calibration rather than of clairvoyance. The measure rewards being right about how often things happen, and it is deliberately blunt about sharpness: a forecast that is confidently wrong is punished harder than one that is vaguely right. This site computes it across the resolved historical episodes only and leaves the open window out entirely, because a window that has not closed cannot be scored against an outcome.",
    related: ["calibration-drift", "crowd-signal", "logistic-anchor"],
    source: "src/lib/model/quantitative.ts — computeBrierAndAuc",
  },

  // ── C ────────────────────────────────────────────────────────────────────
  {
    id: "calibration-drift",
    term: "Calibration drift",
    short: "How far a model moves a published probability once its calibration changes.",
    body: "Every probability on this site comes from a logistic curve with a fixed anchor and a fixed slope. When that curve is recalibrated, the same underlying composite score maps to a different probability, and a historical consistency table printed under the old curve no longer lines up row for row. That gap is the calibration drift, and the methodology publishes it instead of quietly reprinting the table. Drift is not a forecast error and not evidence that the model got better or worse; it is the arithmetic consequence of moving a mapping, and it has to be read next to the backtests rather than instead of them.",
    related: ["brier-score", "logistic-anchor", "composite-score"],
    source: "src/lib/model/documentFormulas.ts — calibrationDrift",
  },
  {
    id: "capex-to-free-cash-flow",
    term: "Capex-to-free-cash-flow",
    short: "How much of a company's free cash flow its capital spending consumes.",
    body: "Capital expenditure is the cash that buys buildings, servers and other long-lived assets. Free cash flow is what is left after operating cash flow has paid for those assets. The ratio of the two says how much of the company's own cash generation is being spent on building rather than returned, distributed or banked. Below one, the company is funding its build out of the cash it generates; above one, it is funding the build out of cash it raises. This site scores the aggregate hyperscaler ratio as one of the legs of the capex-versus-cash-flow factor, one of the eight risk factors behind the published probability.",
    related: ["free-cash-flow", "operating-cash-flow", "gpu-depreciation-drag", "leverage"],
    source: "src/lib/model/factors.ts — MODEL_FACTORS.capex_cashflow",
  },
  {
    id: "cape",
    term: "CAPE",
    short: "Price/earnings adjusted for a full cycle of earnings, so the cycle does not flatter or punish the reading.",
    body: "Robert Shiller's cyclically adjusted price/earnings ratio divides the market price of an index by its average inflation-adjusted earnings over the previous ten years rather than by last year's. The point is to stop the ratio swinging with the cycle: a high multiple today is not remarkable if the earnings base behind it is a peak, and a low multiple in a recession is not cheapness. A high CAPE means the market is paying a great deal for a decade of earnings, and long-duration assets are the ones most exposed to that, because their value sits far in the future. This site applies the adjustment to the AI sector's own multiple, anchored on the published price/sales readings rather than on an index.",
    related: ["cape-excess-yield", "equity-risk-premium", "price-to-sales"],
    source: "src/lib/model/quantitative.ts — computeShillerCapeModel",
  },
  {
    id: "cape-excess-yield",
    term: "Excess CAPE yield",
    short: "The cyclically adjusted earnings yield minus the real risk-free rate: the premium left for taking equity risk.",
    body: "The inverse of CAPE is the earnings yield, the return the index's own earnings would pay. Subtract the real yield on the ten-year Treasury and the remainder is the excess CAPE yield, which is the compensation an investor is being offered for taking equity risk rather than lending to the government. A compressed excess yield means the market is paying almost nothing for the privilege, and that is the condition in which a small disappointment produces a large repricing. The published bands are compressed below 1.5%, normal between 1.5% and 3.5%, and elevated above that; the figure is quoted on a real-yield basis with the inflation series named alongside it.",
    related: ["cape", "equity-risk-premium"],
    source: "src/lib/model/documentFormulas.ts — MODEL_DOC_FORMULAS.shiller_ecy",
  },
  {
    id: "circular-financing",
    term: "Circular financing",
    short: "Money a vendor or investor puts into a customer, who spends it straight back with the same vendor.",
    body: "The structure is simple and the problem is structural. A chip designer invests in a cloud provider; the provider buys the designer's silicon with the money it received; the designer's revenue, which included that sale, is then used to justify the valuation that made the investment possible in the first place. Demand looks external and is not. In a downturn the loop breaks at its weakest point, and because the same counterparty sits on both legs the exposure is correlated rather than diversified. This site tracks circular financings in the ledger and scores the circular share of disclosed capital inside the concentration and circularity factor.",
    related: ["vendor-financing", "convertible-note", "mega-deal"],
    source: "src/app/ledger/_components/ledgerData.ts — GLOSSARY",
  },
  {
    id: "composite-score",
    term: "Composite score",
    short: "The 0–100 stress number the weighted factors add up to, before it is turned into a probability.",
    body: "The composite is the model's intermediate output. Each factor earns a share of its published weight, the earned points are renormalised so that a missing input does not make the score look calm, the contagion term is added and the real-use damper is subtracted, and what is left is a single number on a 0–100 scale. It is not a probability, it has no natural zero, and a single point means something different at 20 than it does at 80. The logistic mapping is what turns it into the headline percentage; the methodology publishes the weights, the mapping and the failure cases.",
    related: ["logistic-anchor", "contagion-term", "fragility-index", "input-sensitivity-band"],
    source: "src/lib/model/factors.ts — MODEL_FACTORS",
  },
  {
    id: "contagion-term",
    term: "Contagion term",
    short: "The model's non-linear add-on for the case where credit, debt and rate stress arrive at the same time.",
    body: "In credit panics risk is super-additive: the same shock is larger when it lands on a levered balance sheet while rates are high, and smaller when it does not. The model's contagion term, published as the systemic contagion synergy, takes the cube root of the product of three excess factor scores, so it stays at nothing until credit, debt reliance and macro stress are all above their thresholds together. Its credit leg deliberately consumes the credit factor's tail-free core score, so a convex credit tail is never counted twice. It is not a ninth risk factor; it is an adjustment to the way the existing eight combine.",
    related: ["composite-score", "cds-spread", "fragility-index"],
    source: "src/lib/model/documentFormulas.ts — MODEL_DOC_FORMULAS.systemic_contagion",
  },
  {
    id: "convertible-note",
    term: "Convertible note",
    short: "A loan that can be converted into shares, so the holder's return depends on the share price.",
    body: "A convertible note is a bond that gives the holder the option to swap the principal for equity at a set price. The issuer gets cheaper money and delayed dilution; the holder keeps downside protection as a creditor and keeps the upside as an owner. The conversion price is the whole negotiation: set above the current share price, the note behaves like straight debt until the shares rally through it. For AI borrowers the structure is common because the collateral is hard to value, since a GPU fleet can be financed and a model lab's pipeline cannot. The ledger counts these facilities as debt, because the repayment obligation is there whatever the share price does.",
    related: ["circular-financing", "debt-share", "minsky-regime"],
    source: "src/data/deals.json — is_debt records",
  },
  {
    id: "credit-default-swap",
    term: "Credit default swap",
    short: "An insurance contract on a company's debt: the buyer pays a premium, the seller pays out if the borrower defaults.",
    body: "A CDS is a derivative rather than a loan, but it prices the same thing a loan prices, which is the risk that a named borrower fails to pay. The protection buyer pays a running premium expressed in basis points of the notional; the seller carries the loss. Because the premium is quoted continuously by dealers, a CDS is one of the fastest-moving published prices in credit, and it often moves before the bonds do, because the swap market is where hedging demand shows up first. It also has a blind spot: it prices one named reference entity, so a problem spread across an industry will not fully appear in any single issuer's swap.",
    related: ["cds-spread", "high-yield-oas", "distance-to-default"],
    source: "src/lib/model/factors.ts — MODEL_FACTORS.cds_stress",
  },
  {
    id: "cds-spread",
    term: "CDS spread",
    short: "The annual price of insuring a named borrower's debt, quoted in basis points of the amount protected.",
    body: "A spread of 100 basis points means the protection buyer pays one percent of the notional a year for the insurance; 500 basis points means five percent. It is the cleanest single-number read on what the credit market thinks a company is worth in default terms, and the market reprices it continuously. Two things have to be kept apart when reading it: the level, which says how stressed the borrower is against its own history, and the momentum, which says whether the stress is still building. A flat print at a record high means the market has stopped adding fear, not that it has taken any back.",
    related: ["credit-default-swap", "high-yield-oas", "credit-freeze"],
    source: "src/lib/model/factors.ts — MODEL_FACTORS.cds_stress",
  },
  {
    id: "credit-freeze",
    term: "Credit freeze",
    short: "A sudden closure of the credit market, when lenders stop rolling over what they owe.",
    body: "A credit freeze is not a rise in interest rates; it is a refusal. Lenders decline to refinance maturing obligations, cut new lines and shorten tenor, and a borrower that cannot fund from operations faces a maturity wall it never planned for. It is the mechanism through which a solvency problem becomes a liquidity problem, and it is why the market-implied price of default can move faster than the underlying condition. This site scores a narrower and computable version of the idea: the probability that the tracked debt base cannot be refinanced inside twelve months.",
    related: ["refinancing-freeze", "liquidity-vs-solvency", "cds-spread"],
    source: "src/lib/model/quantitative.ts — computeMinskyModel",
  },
  {
    id: "crowd-signal",
    term: "Crowd signal",
    short: "What money-weighted prediction-market participants currently price for the question the site answers.",
    body: "The crowd leg of the model reads the blended YES price on the tracked AI-downturn contracts, weighted by the volume actually traded in each. Prediction-market odds are the closest thing to a continuously quoted, money-backed opinion on the specific question, which is exactly what makes them a useful check on the model and a poor substitute for it. Thin books move on small flows, so the factor down-weights low-volume contracts rather than treating every print as equally informed. The published band also uses a market-implied figure as its floor, so the model can never publish a probability below what money on the line is already pricing.",
    related: ["prediction-market-odds", "brier-score", "calibration-drift"],
    source: "src/lib/model/factors.ts — MODEL_FACTORS.crowd_signal",
  },

  // ── D ────────────────────────────────────────────────────────────────────
  {
    id: "debt-issuance-velocity",
    term: "Debt issuance velocity",
    short: "The annualised pace at which new AI-related debt is being issued.",
    body: "Velocity measures how fast borrowing is happening, not how much is outstanding. A large stock of debt can be an old balance sheet being paid down, while a rising pace of new issuance says lenders are currently writing cheques. For the AI build-out the number matters because so much of the debt is being written against assets, GPU fleets and datacenter contracts, whose resale value and cash generation are not yet proven. This site carries the annualised issuance pace as one leg of the debt reliance and issuance velocity factor.",
    related: ["debt-share", "backlog-share", "convertible-note"],
    source: "src/lib/model/factors.ts — MODEL_FACTORS.debt_reliance",
  },
  {
    id: "debt-share",
    term: "Debt share",
    short: "The proportion of tracked disclosed capital that is borrowed rather than raised as equity.",
    body: "Debt share separates money that must be repaid from money that never has to be. Equity is a claim on future profits and can be diluted; debt is a claim on the balance sheet and comes due regardless of how the year went. A high debt share means the build-out is being financed by creditors rather than by the people who own the upside, and that is what turns a valuation argument into a solvency argument. On this site the figure is a share of the disclosed capital in the ledger rather than a share of the entire AI market, and the ledger guide is explicit about that distinction.",
    related: ["minsky-regime", "convertible-note", "leverage", "debt-issuance-velocity"],
    source: "src/lib/model/factors.ts — MODEL_FACTORS.debt_reliance",
  },
  {
    id: "distance-to-default",
    term: "Distance to default",
    short: "How many standard deviations of asset-value volatility a company sits from the point where its assets stop covering its debt.",
    body: "Robert Merton's 1974 structural model treats a company as a claim on its assets struck against a fixed debt obligation. The distance to default is the number of standard deviations of the asset's own volatility between the firm's current asset value and the point at which the assets no longer cover the debt; the default probability is the chance of crossing that point before the maturity. The measure rests on two inputs that are never observed directly, namely the value and the volatility of the assets, so the distance is an estimate built on estimates. The published figure is stated in standard deviations and paired with an implied probability rather than left as a bare number.",
    related: ["altman-z-score", "fragility-index", "credit-default-swap"],
    source: "src/lib/model/documentFormulas.ts — MODEL_DOC_FORMULAS.merton_dd",
  },
  {
    id: "drawdown",
    term: "Drawdown",
    short: "The fall from a high, measured as a percentage of that high.",
    body: "A drawdown is only meaningful when the reference is named: a 52-week high, an all-time high, a closing price. It is the standard way of expressing how far a market sits from the optimism it has already priced, and the reference matters because the same fall from two different highs is two different numbers. This site tracks each covered name's distance from its record high, because the resolution conditions written into the tracked AI-downturn contracts are expressed in exactly this language, as a specified drawdown on a named index or supplier.",
    related: ["resolution-criteria", "prediction-market-odds"],
    source: "src/data/live-stocks.ts — drawdownFromAthPct",
  },

  // ── E ────────────────────────────────────────────────────────────────────
  {
    id: "equity-risk-premium",
    term: "Equity risk premium",
    short: "The extra return equities are expected to pay over the risk-free rate.",
    body: "The premium is the price of uncertainty: what an investor earns for bearing the possibility of a permanent loss of capital, over and above what the same money would earn in government bonds. When the premium is large, investors are being paid to take risk and the market has usually already fallen; when it is thin, the market is offering almost no cushion, and a small disappointment produces a much larger repricing. This site measures it through the excess CAPE yield, which is the cyclically adjusted version of the same idea.",
    related: ["cape-excess-yield", "cape"],
    source: "src/lib/model/quantitative.ts — computeShillerCapeModel",
  },

  // ── F ────────────────────────────────────────────────────────────────────
  {
    id: "fragility-index",
    term: "Fragility index",
    short: "A 0–100 read of how close the tracked system is to a funding shock.",
    body: "There are two fragility numbers on this site and they are not the same thing. The Minsky Financial Fragility Index is a weighted sum of the speculative and Ponzi shares of tracked debt, the excess of the credit spread over its own baseline, and the gap between capital spending and operating cash flow. The Financial Fragility Index published alongside the composite is a linear re-expression of the same factor scores the model already uses, and the site labels it as exactly that, neither an independent measurement nor a first derivative. Read either as a gauge of the same system rather than as a separate instrument.",
    related: ["minsky-regime", "composite-score", "distance-to-default", "contagion-term"],
    source: "src/lib/model/documentFormulas.ts — MODEL_DOC_FORMULAS.fragility_index",
  },
  {
    id: "free-cash-flow",
    term: "Free cash flow",
    short: "Cash a business generates after paying for the assets it needs to keep running.",
    body: "Free cash flow starts with the cash the business earns from trading and subtracts the capital expenditure needed to maintain and expand the asset base. What is left is either distributed to owners, used to repay debt, or banked. It is also the number that has to cover a large build-out, which is why the ratio of capital spending to free cash flow is one of the clearest available statements of whether a company is funding its expansion from its own economics or from the market. A negative figure is not a curiosity: it means the build-out is being financed elsewhere.",
    related: ["operating-cash-flow", "capex-to-free-cash-flow", "gpu-depreciation-drag"],
    source: "src/lib/model/factors.ts — MODEL_FACTORS.capex_cashflow",
  },

  // ── G ────────────────────────────────────────────────────────────────────
  {
    id: "gpu-depreciation-drag",
    term: "GPU depreciation drag",
    short: "The annual cost of writing down a fleet of AI accelerators as they age and lose resale value.",
    body: "A GPU fleet is a wasting asset. It depreciates on a schedule, and the accounting charge is the difference between what it cost and what the hardware is expected to be worth at the end of its useful life. For AI capital spending that charge is unusually large, because the useful life assumed in the schedule is far shorter than the physical life of the silicon, and a chip bought for training can be worth a fraction of its price in the secondary market within a couple of years. The annual charge is a real claim on cash rather than an accounting abstraction, and it is the part of the build-out that never appears in a headline capex figure.",
    related: ["capex-to-free-cash-flow", "free-cash-flow", "leverage"],
    source: "src/lib/model/factors.ts — INPUTS_WITHOUT_WEIGHT (aiDebt.gpuDepreciationDragUsd)",
  },

  // ── H ────────────────────────────────────────────────────────────────────
  {
    id: "high-yield-oas",
    term: "High-yield spread (HY-OAS)",
    short: "The average credit spread on US junk bonds, measured option-adjusted over Treasuries.",
    body: "The high-yield option-adjusted spread is the average extra yield that below-investment-grade corporate bonds pay over Treasuries, with the embedded options in the bonds adjusted out so the series stays comparable over time. It is the broad market thermometer for junk credit, and it moves with the credit cycle as a whole rather than with any single borrower. Its blind spot is the mirror image of the single-issuer swap: it says nothing about which company is in trouble, only that the market has repriced risk in general. This site reads it as one leg of the macro factor and as a linked series in the simulation.",
    related: ["cds-spread", "credit-default-swap", "credit-freeze"],
    source: "src/lib/model/factors.ts — MODEL_FACTORS.macro_rates",
  },

  // ── I ────────────────────────────────────────────────────────────────────
  {
    id: "input-sensitivity-band",
    term: "Input-sensitivity band",
    short: "The published range of model outputs when the inputs are shocked, not a probability interval.",
    body: "The range around the point estimate comes from simulating correlated shocks to the inputs, namely the ten-year yield, the credit spread, the capital spending path and the valuation multiple. It is regularly mistaken for a confidence interval on the probability, and it is not one: it says how far the output moves when the inputs move, and the inputs are assumptions that carry their own error bars. The published label for the range says so in as many words, and the distinction is worth holding, because a range mistaken for an interval invites more confidence than the simulation can support.",
    related: ["monte-carlo-var", "composite-score", "crowd-signal"],
    source: "src/lib/model/quantitative.ts — CI_TYPE",
  },

  // ── L ────────────────────────────────────────────────────────────────────
  {
    id: "leverage",
    term: "Leverage",
    short: "Capital spending divided by revenue: how many dollars of assets a dollar of sales requires.",
    body: "Leverage in the sense this site uses it is capital intensity rather than debt gearing: capital expenditure over revenue. A business that needs eight dollars of assets for every dollar of sales has a very different cash profile from one that needs one, and it takes far longer for the revenue to catch up with the spending. The ratio cuts both ways, because it is the reason a build-out can look cheap on a multiple and expensive on cash. This site carries the capex-to-revenue multiple as context for the demand damper; no risk factor scores it today, and the published list of unweighted inputs says so.",
    related: ["capex-to-free-cash-flow", "debt-share", "free-cash-flow", "gpu-depreciation-drag"],
    source: "src/lib/model/factors.ts — INPUTS_WITHOUT_WEIGHT (aiDebt.capexToRevenueMultiple)",
  },
  {
    id: "liquidity-vs-solvency",
    term: "Liquidity and solvency",
    short: "Two different failures: not having the cash when it is due, and not having enough assets to cover the debt.",
    body: "A solvent company with a cash problem is usually fine in the long run and can still be dead by Friday. A company whose assets no longer cover its obligations is in trouble no matter how much cash it holds, because the cash has to come out of the assets. The two failures are constantly confused, and in a credit shock they arrive in sequence: a liquidity squeeze forces asset sales, the asset sales reprice the balance sheet, and what began as a timing problem becomes a solvency problem. Most of the machinery on this site, the spreads and the refinancing probability and the fragility indices, is aimed at the second question, with the first as the trigger.",
    related: ["credit-freeze", "refinancing-freeze", "minsky-regime", "distance-to-default"],
    source: "src/lib/model/quantitative.ts — computeMinskyModel",
  },
  {
    id: "logistic-anchor",
    term: "Logistic anchor",
    short: "The composite score at which the model publishes a 50% probability, and the slope around it.",
    body: "The probability is not a linear function of the composite score; it is a logistic curve, so the mapping is gentle in the middle and steep in the tails. The anchor is the score the curve is centred on, at which the published probability is 50%, and the steepness sets how many composite points it takes to move the odds by a given multiple. This matters for reading the print, because a nine-point move multiplies the odds rather than adding nine percentage points, and the same nine points mean something very different near the anchor than at the extremes. Both constants are published, and both are judgement rather than measurement.",
    related: ["composite-score", "calibration-drift", "brier-score"],
    source: "src/lib/model/factors.ts — MODEL_CALIBRATION",
  },
  {
    id: "lppls-hazard",
    term: "LPPLS crash-hazard index",
    short: "An index built from the log-periodic power-law literature, on a 0–100 scale that is not a probability.",
    body: "The log-periodic power law singularity model argues that a bubble does not end randomly: as it accelerates, the growth rate of the price starts oscillating with an accelerating period, and the final blow-off has a predictable shape even when its timing does not. The site's implementation does not fit that model to a price series. It builds a hazard index from the credit spread and the ratio of capital spending to operating cash flow, and publishes the result without a percent sign so that it cannot be read as a chance of a crash. It is a gauge of how close the system is to the conditions the literature describes, not a forecast of a date.",
    related: ["cds-spread", "fragility-index", "input-sensitivity-band"],
    source: "src/lib/model/documentFormulas.ts — MODEL_DOC_FORMULAS.lppls_hazard",
  },

  // ── M ────────────────────────────────────────────────────────────────────
  {
    id: "mega-deal",
    term: "Mega-deal",
    short: "A single disclosed commitment of ten billion dollars or more.",
    body: "The threshold is this site's own, and it is a line about scale rather than a standard from any regulator. A large deal changes the arithmetic of the system in a way a small one does not: it moves a counterparty's balance sheet, it locks in a supply commitment, and it shifts the concentration of the whole market. The funding velocity factor uses the gap since the last mega-deal as one of its readings, on the reasoning that a top either ends with a bang or with a sudden hush.",
    related: ["backlog-share", "circular-financing", "debt-issuance-velocity"],
    source: "src/app/ledger/_components/ledgerData.ts — GLOSSARY",
  },
  {
    id: "minsky-regime",
    term: "Minsky regime",
    short: "The hedge, speculative and ponzi classification of debt by whether cash flow covers the principal.",
    body: "Hyman Minsky's argument is that stability is the thing that causes the instability. A hedge unit's operating cash flow covers both its interest and its principal. A speculative unit covers its interest but must roll its principal over, so it needs continuous access to the market. A ponzi unit does not cover its interest at all and pays it out of new equity, new debt or rising asset prices. The movement from hedge to speculative to ponzi is a loss of financing capacity, and it is the point at which a price correction stops being a valuation event and becomes a funding event. This site classifies the tracked debt into the three regimes and publishes the shares alongside the fragility index.",
    related: ["fragility-index", "refinancing-freeze", "debt-share", "liquidity-vs-solvency"],
    source: "src/lib/model/quantitative.ts — computeMinskyModel",
  },
  {
    id: "monte-carlo-var",
    term: "Monte Carlo VaR95 and CVaR95",
    short: "The tail read of a simulation: the 95th-percentile outcome, and the average of the worst five percent.",
    body: "Value at risk answers one question, how bad the bad outcome is at a given confidence level, and it answers it by naming a threshold and saying there is a five percent chance of being worse than it. Conditional value at risk, also called expected shortfall, answers the better question: given that you are in that worst five percent, how bad is it on average. The two differ precisely in the tail, and the tail is where the information is. On this site both are computed from the simulation of shocked inputs and reported in the model's own probability units.",
    related: ["input-sensitivity-band", "composite-score", "lppls-hazard"],
    source: "src/lib/model/quantitative.ts — MonteCarloSimulationResult",
  },

  // ── O ────────────────────────────────────────────────────────────────────
  {
    id: "operating-cash-flow",
    term: "Operating cash flow",
    short: "The cash the business itself generates from trading, before any investment decision.",
    body: "Operating cash flow is what comes in from customers minus what goes out to suppliers, staff and taxes: the cash of the business as it trades, before capital spending and before financing. It is the closest thing a company has to a vital sign, because it is hard to flatter, since revenue recognition and adjusted earnings can be managed while cash from operations is harder. It is also the denominator in the ratio that shows whether a build-out is being funded from operations or from the markets.",
    related: ["free-cash-flow", "capex-to-free-cash-flow", "minsky-regime"],
    source: "src/lib/model/factors.ts — MODEL_FACTORS.capex_cashflow",
  },

  // ── P ────────────────────────────────────────────────────────────────────
  {
    id: "prediction-market-odds",
    term: "Prediction-market odds",
    short: "The price of a yes-or-no contract on a future event, quoted as a probability.",
    body: "A prediction market is an exchange for contracts on future events. A contract priced at nine cents is a nine percent probability, because that is what a buyer pays and a seller receives per dollar at settlement. The odds are only as good as the market behind them: depth, the number of participants, and whether the contract's wording is clear enough to resolve without argument. The tracked contracts are the AI-downturn markets, and their volume and liquidity are published alongside the odds so a reader can judge which of the numbers carry weight.",
    related: ["crowd-signal", "resolution-criteria", "input-sensitivity-band"],
    source: "src/data/polymarket-data.ts — POLYMARKET_FEATURED_MARKETS",
  },
  {
    id: "price-to-sales",
    term: "Price/sales multiple",
    short: "Market value divided by revenue: what a company is valued at per dollar of sales.",
    body: "A price/sales multiple sidesteps earnings, which for a young company can be negative, absurdly small or shaped by depreciation policy, and compares what the market pays for a dollar of top-line revenue. It is the standard yardstick for pre-profit companies, and the multiple is only comparable across companies when the revenue bases are comparable, which is why this site insists on run-rate revenue and excludes laboratories below a commercial scale from the median it takes. The reading is a measure of what is being paid, and not of whether it is justified.",
    related: ["run-rate-revenue", "cape", "leverage"],
    source: "src/lib/model/factors.ts — MODEL_FACTORS.valuation_stretch",
  },

  // ── R ────────────────────────────────────────────────────────────────────
  {
    id: "refinancing-freeze",
    term: "Refinancing freeze",
    short: "The computed probability that the tracked debt base cannot be rolled over inside twelve months.",
    body: "This is the site's narrow and computable version of a credit freeze: a probability built from the Ponzi share of tracked debt and the amount by which the credit spread sits above its own baseline, on a twelve-month horizon. It is a scenario number rather than a forecast, and it is deliberately sensitive to the two inputs that describe a market already under stress. A reading near zero means the arithmetic does not support a freeze, not that the market is safe, and the published formula names both inputs so the reader can rebuild it.",
    related: ["credit-freeze", "minsky-regime", "liquidity-vs-solvency", "cds-spread"],
    source: "src/lib/model/documentFormulas.ts — MODEL_DOC_FORMULAS.refi_freeze",
  },
  {
    id: "resolution-criteria",
    term: "Resolution criteria",
    short: "The written conditions under which a prediction-market contract settles as yes or no.",
    body: "A contract is only as good as its settlement language. Resolution criteria state the observable event, the source that will be read, the threshold and the window: a named index closing a specified percentage below its peak inside a stated period, or a rental index holding below a number for consecutive days. They are what stops a contract being settled by argument, and reading them is the only way to know what a price of nine percent is actually pricing. This site publishes the criteria for the tracked AI-downturn contracts alongside the odds, because the two belong together.",
    related: ["prediction-market-odds", "drawdown", "crowd-signal"],
    source: "src/data/polymarket-data.ts — POLYMARKET_RESOLUTION_CONDITIONS",
  },
  {
    id: "run-rate-revenue",
    term: "Run-rate revenue",
    short: "The latest period's revenue annualised, used as the denominator for valuation multiples.",
    body: "Run-rate revenue takes the most recent period's revenue and multiplies it up to an annual figure. It is a forward extrapolation of a single period, which is exactly its strength and exactly its weakness: it reflects current momentum, and it is wrong if the current period is not representative. Because private labs do not publish audited trailing revenue, run-rate is the only revenue basis available for them, and any price/sales multiple built on it inherits that uncertainty. The site states which period and which basis each figure uses rather than blending them.",
    related: ["price-to-sales", "leverage"],
    source: "src/lib/model/factors.ts — MODEL_FACTORS.valuation_stretch",
  },

  // ── U ────────────────────────────────────────────────────────────────────
  {
    id: "upside-downside",
    term: "Upside and downside",
    short: "The two ends of a scenario, quoted as the change from the current price rather than as a price.",
    body: "Upside and downside are stated as percentages so that they can be compared across instruments with different prices and different moneyness. A downside of forty percent means the position loses forty percent of its value if the event happens, not that it falls to sixty cents. The convention matters most where the two ends are not symmetric, because a twenty percent gain takes an eighty percent fall to undo, and a downside case therefore has to be sized against the actual starting value rather than against a symmetric assumption. This entry is here for the general usage. The site's own outputs are probability statements rather than price targets, and the methodology says which is which.",
  },

  // ── V ────────────────────────────────────────────────────────────────────
  {
    id: "vendor-financing",
    term: "Vendor financing",
    short: "A supplier extends credit to its customer so the customer can buy the supplier's own product.",
    body: "Vendor financing is a sale carried on the supplier's balance sheet rather than the customer's: the supplier ships the hardware now and the customer pays later, usually through a lending partner. In exchange for carrying the credit risk the supplier takes a wider margin, and the customer gets capacity without raising equity or drawing a bank facility. The risk sits with the party least able to absorb it, because the vendor's receivable becomes a claim on a customer whose revenue depends on the very hardware it bought. When the arrangement is routed through an investment vehicle that then invests back in the customer, it becomes circular financing.",
    related: ["circular-financing", "convertible-note", "mega-deal"],
    source: "src/app/ledger/_components/ledgerData.ts — GLOSSARY",
  },
];

/**
 * The registry indexed by id, for the cross-links and for the page header.
 * Built once at module load so a broken cross-link is a build failure rather
 * than a dead anchor in production.
 */
export const GLOSSARY_TERM_BY_ID: Record<string, GlossaryTerm> = Object.fromEntries(
  GLOSSARY_TERMS.map((t) => [t.id, t]),
);

/**
 * Integrity check. A duplicated id would give two terms the same anchor, and a
 * cross-link to an id that does not exist would jump nowhere. Both are cheap to
 * catch here and expensive to catch in production, so this throws at build
 * time rather than rendering a broken page.
 */
export function assertGlossaryIntegrity(terms: GlossaryTerm[] = GLOSSARY_TERMS): void {
  const seen = new Set<string>();
  for (const term of terms) {
    if (seen.has(term.id)) {
      throw new Error(`[glossary] duplicate term id: ${term.id}`);
    }
    seen.add(term.id);
    if (!/^[a-z0-9-]+$/.test(term.id)) {
      throw new Error(`[glossary] term id is not URL-safe: ${term.id}`);
    }
    for (const related of term.related ?? []) {
      if (!seen.has(related) && !terms.some((t) => t.id === related)) {
        throw new Error(`[glossary] ${term.id} points at an unknown term: ${related}`);
      }
    }
  }
}

assertGlossaryIntegrity();
