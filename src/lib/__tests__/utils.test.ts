import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('text-red-500', 'bg-blue-500');
      expect(result).toBe('text-red-500 bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      
      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      );
      
      expect(result).toBe('base-class active-class');
    });

    it('should merge Tailwind classes with conflicts correctly', () => {
      // twMerge should handle conflicting Tailwind classes
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8'); // Later class should win
    });

    it('should handle arrays of classes', () => {
      const result = cn(['text-sm', 'font-bold'], 'text-lg');
      expect(result).toBe('font-bold text-lg'); // text-lg should override text-sm
    });

    it('should handle objects with conditional classes', () => {
      const result = cn({
        'text-red-500': true,
        'bg-blue-500': false,
        'font-bold': true,
      });
      
      expect(result).toBe('text-red-500 font-bold');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'end');
      expect(result).toBe('base end');
    });

    it('should handle empty strings', () => {
      const result = cn('', 'text-red-500', '');
      expect(result).toBe('text-red-500');
    });

    it('should return empty string when no valid classes', () => {
      const result = cn(undefined, null, false, '');
      expect(result).toBe('');
    });

    it('should merge complex Tailwind utilities', () => {
      const result = cn(
        'hover:bg-gray-100 hover:bg-blue-200',
        'focus:outline-none focus:ring-2'
      );
      expect(result).toBe('hover:bg-blue-200 focus:outline-none focus:ring-2');
    });

    it('should handle responsive utilities correctly', () => {
      const result = cn('md:p-4', 'lg:p-8', 'md:p-6');
      expect(result).toBe('lg:p-8 md:p-6'); // md:p-6 should override md:p-4
    });

    it('should preserve non-Tailwind classes', () => {
      const result = cn('custom-class', 'text-red-500', 'another-custom');
      expect(result).toBe('custom-class text-red-500 another-custom');
    });

    it('should handle nested arrays and mixed types', () => {
      const result = cn(
        'base',
        ['nested', ['deeply-nested']],
        { conditional: true },
        undefined,
        'final'
      );
      expect(result).toBe('base nested deeply-nested conditional final');
    });

    it('should merge color utilities correctly', () => {
      const result = cn('text-red-500', 'text-blue-600');
      expect(result).toBe('text-blue-600');
    });

    it('should merge spacing utilities correctly', () => {
      const result = cn('mt-4 mb-4', 'mt-8');
      expect(result).toBe('mb-4 mt-8');
    });

    it('should handle arbitrary values', () => {
      const result = cn('w-[100px]', 'w-[200px]');
      expect(result).toBe('w-[200px]');
    });

    it('should handle important modifiers', () => {
      const result = cn('!text-red-500', 'text-blue-500');
      expect(result).toBe('!text-red-500 text-blue-500');
    });

    it('should work with template literals', () => {
      const size = 'lg';
      const color = 'blue';
      const result = cn(`text-${size}`, `bg-${color}-500`);
      expect(result).toBe('text-lg bg-blue-500');
    });
  });
});