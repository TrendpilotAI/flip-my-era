/**
 * PlanSelector — redirects to the new PricingPage component
 */
import { SEO } from '@/modules/shared/components/SEO';
import PricingPage from '@/modules/shared/components/PricingPage';

const PlanSelector = () => (
  <>
    <SEO title="Plans & Pricing" description="Compare FlipMyEra plans — find the perfect option for your personalized storybook needs." url="/plans" />
    <PricingPage />
  </>
);

export default PlanSelector;
