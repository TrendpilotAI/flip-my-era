import { useState } from 'react';
import { type EraType, ERA_CONFIG } from '@/modules/story/types/eras';
import eraImages from '@/modules/story/data/eraImages.json';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent } from '@/modules/shared/components/ui/card';

type ColorTheme = 'purple' | 'pink' | 'blue' | 'gold' | 'dark';

interface OnboardingState {
  era: EraType | null;
  recipientName: string;
  dedication: string;
  colorTheme: ColorTheme;
}

const COLOR_THEMES: { id: ColorTheme; label: string; gradient: string }[] = [
  { id: 'purple', label: 'Purple Haze', gradient: 'from-purple-500 to-indigo-600' },
  { id: 'pink', label: 'Lover Pink', gradient: 'from-pink-400 to-rose-500' },
  { id: 'blue', label: 'Midnights Blue', gradient: 'from-blue-500 to-cyan-600' },
  { id: 'gold', label: 'Fearless Gold', gradient: 'from-amber-400 to-yellow-500' },
  { id: 'dark', label: 'Reputation Dark', gradient: 'from-gray-700 to-gray-900' },
];

interface OnboardingWizardProps {
  onComplete: (data: OnboardingState) => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<OnboardingState>({
    era: null,
    recipientName: '',
    dedication: '',
    colorTheme: 'purple',
  });

  const eras = Object.values(ERA_CONFIG);
  const canNext = step === 1 ? !!state.era : step === 2 ? !!state.recipientName.trim() : true;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          {['Pick Your Era', 'Customize', 'Preview'].map((label, i) => (
            <span key={label} className={i + 1 <= step ? 'text-purple-600 font-semibold' : ''}>{label}</span>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
        <p className="text-center text-sm text-gray-400 mt-2">Step {step} of 3</p>
      </div>

      {/* Step 1: Pick Your Era */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold text-center mb-6">Pick Your Era ✨</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {eras.map((era) => {
              const img = eraImages[era.id as keyof typeof eraImages];
              const selected = state.era === era.id;
              return (
                <button
                  key={era.id}
                  onClick={() => setState((s) => ({ ...s, era: era.id }))}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                    selected ? 'border-purple-500 ring-2 ring-purple-300 scale-[1.03]' : 'border-transparent hover:border-purple-200'
                  }`}
                >
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    {img ? (
                      <img src={img} alt={era.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">🎵</span>
                    )}
                  </div>
                  <div className="p-2 text-center bg-white/90 dark:bg-gray-800/90">
                    <p className="font-semibold text-sm">{era.displayName}</p>
                  </div>
                  {selected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Customize */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center mb-6">Customize Your Ebook 💜</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient Name *</label>
            <input
              type="text"
              value={state.recipientName}
              onChange={(e) => setState((s) => ({ ...s, recipientName: e.target.value }))}
              placeholder="Who is this ebook for?"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-2 focus:ring-purple-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dedication (optional)</label>
            <textarea
              value={state.dedication}
              onChange={(e) => setState((s) => ({ ...s, dedication: e.target.value }))}
              placeholder="Add a personal message..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-2 focus:ring-purple-400 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color Theme</label>
            <div className="flex gap-3 flex-wrap">
              {COLOR_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setState((s) => ({ ...s, colorTheme: t.id }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    state.colorTheme === t.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${t.gradient}`} />
                  <span className="text-sm">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && state.era && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center mb-6">Preview Your Ebook 📖</h2>
          <Card className="max-w-sm mx-auto overflow-hidden shadow-xl">
            <div className={`aspect-[3/4] bg-gradient-to-br ${COLOR_THEMES.find((t) => t.id === state.colorTheme)?.gradient || 'from-purple-500 to-pink-500'} flex flex-col items-center justify-center p-8 text-white`}>
              <p className="text-sm uppercase tracking-widest opacity-80 mb-2">A FlipMyEra Story</p>
              <h3 className="text-2xl font-bold text-center mb-4">{ERA_CONFIG[state.era].displayName}</h3>
              <div className="w-16 h-0.5 bg-white/50 mb-4" />
              <p className="text-lg text-center">For {state.recipientName}</p>
              {state.dedication && (
                <p className="text-sm text-center mt-4 italic opacity-80">"{state.dedication}"</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
          ← Back
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            Next →
          </Button>
        ) : (
          <Button onClick={() => onComplete(state)} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            Create My Ebook ✨
          </Button>
        )}
      </div>
    </div>
  );
}

export default OnboardingWizard;
