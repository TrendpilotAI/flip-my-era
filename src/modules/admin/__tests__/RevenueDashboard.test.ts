import { describe, it, expect } from 'vitest';
import {
  calculateMRR,
  calculateChurnRate,
  calculateLTV,
  calculateARPU,
  computeRevenueMetrics,
} from '../RevenueDashboard';
import type { RevenueDataPoint } from '../RevenueDashboard';

describe('Revenue Dashboard Calculations', () => {
  describe('calculateMRR', () => {
    it('sums monthly amounts', () => {
      const subs = [{ monthlyAmount: 9.99 }, { monthlyAmount: 19.99 }, { monthlyAmount: 49.99 }];
      expect(calculateMRR(subs)).toBeCloseTo(79.97, 2);
    });

    it('returns 0 for empty array', () => {
      expect(calculateMRR([])).toBe(0);
    });
  });

  describe('calculateChurnRate', () => {
    it('calculates correct churn percentage', () => {
      expect(calculateChurnRate(100, 5)).toBe(5);
    });

    it('returns 0 when no starting subscribers', () => {
      expect(calculateChurnRate(0, 0)).toBe(0);
    });
  });

  describe('calculateLTV', () => {
    it('calculates LTV from ARPU and churn', () => {
      // ARPU $20, 5% churn → LTV = $20 / 0.05 = $400
      expect(calculateLTV(20, 5)).toBe(400);
    });

    it('caps LTV when churn is 0', () => {
      expect(calculateLTV(20, 0)).toBe(2400); // 20 * 120
    });
  });

  describe('calculateARPU', () => {
    it('divides revenue by users', () => {
      expect(calculateARPU(1000, 50)).toBe(20);
    });

    it('returns 0 for no users', () => {
      expect(calculateARPU(1000, 0)).toBe(0);
    });
  });

  describe('computeRevenueMetrics', () => {
    const sampleData: RevenueDataPoint[] = [
      { month: '2025-01', mrr: 1000, newSubscribers: 20, churnedSubscribers: 2, totalSubscribers: 50, revenue: 1000 },
      { month: '2025-02', mrr: 1500, newSubscribers: 30, churnedSubscribers: 3, totalSubscribers: 77, revenue: 1500 },
    ];

    it('calculates current MRR', () => {
      const metrics = computeRevenueMetrics(sampleData);
      expect(metrics.currentMRR).toBe(1500);
    });

    it('calculates MRR growth rate', () => {
      const metrics = computeRevenueMetrics(sampleData);
      expect(metrics.mrrGrowthRate).toBe(50); // (1500-1000)/1000 * 100
    });

    it('calculates total revenue', () => {
      const metrics = computeRevenueMetrics(sampleData);
      expect(metrics.totalRevenue).toBe(2500);
    });

    it('handles empty data', () => {
      const metrics = computeRevenueMetrics([]);
      expect(metrics.currentMRR).toBe(0);
      expect(metrics.totalRevenue).toBe(0);
    });
  });
});
