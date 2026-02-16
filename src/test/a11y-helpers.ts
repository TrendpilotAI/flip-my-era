/**
 * Accessibility testing helpers using vitest-axe
 *
 * Usage:
 *   import { axeComponent } from '@/test/a11y-helpers';
 *   const results = await axeComponent(container);
 *   expect(results).toHaveNoViolations();
 */
import { axe, type AxeResults } from 'vitest-axe';

export { axe };
export type { AxeResults };

/**
 * Axe configuration for component-level tests.
 * Disables rules that produce false positives when testing
 * components in isolation (outside their parent page context).
 */
export const componentAxeConfig = {
  rules: {
    // Components render without parent h1/h2 headings, causing
    // false heading-order violations in isolation
    'heading-order': { enabled: false },
    // Isolated components may not have a <main> landmark
    region: { enabled: false },
  },
};

/**
 * Run axe on a component container with component-appropriate rules.
 * Use this instead of raw `axe()` for isolated component tests.
 */
export async function axeComponent(container: HTMLElement): Promise<AxeResults> {
  return axe(container, componentAxeConfig);
}
