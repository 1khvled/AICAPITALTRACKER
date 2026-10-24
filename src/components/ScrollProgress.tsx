/**
 * ScrollProgress — one hairline across the top of the document that fills as
 * the reader moves down the page.
 *
 * No JavaScript and no scroll listener: it is a native scroll-driven
 * animation (`animation-timeline: scroll(root block)`), so it runs on the
 * compositor. Browsers without support never paint it; the page is unchanged.
 * `prefers-reduced-motion` removes it in globals.css.
 */
export function ScrollProgress() {
  return <div className="scroll-progress" aria-hidden="true" />;
}

export default ScrollProgress;
