import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Label } from '@/modules/shared/components/ui/label';
import { Switch } from '@/modules/shared/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shared/components/ui/select';
import { Slider } from '@/modules/shared/components/ui/slider';
import { 
  X,
  Settings,
  Type,
  Eye,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Bookmark,
  Palette,
  Zap,
  Heart,
  Star,
  Music,
  Sparkles,
  Lock,
  Info
} from "lucide-react";
import { cn } from '@/core/lib/utils';

interface ReadingPrefs {
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  fontFamily: 'serif' | 'sans' | 'mono';
  lineHeight: 'tight' | 'normal' | 'relaxed';
  darkMode: boolean;
  pageTransition: 'slide' | 'fade' | 'none';
  textToSpeech: boolean;
  autoBookmark: boolean;
}

interface EbookDesignSettings {
  // Typography
  fontFamily: 'serif' | 'sans-serif' | 'monospace';
  fontSize: number; // 12-20px
  lineHeight: number; // 1.2-2.0
  letterSpacing: number; // -0.05 to 0.1em
  textColor: string; // Custom text color in hex format
  chapterHeadingColor: string; // Custom chapter heading color in hex format
  
  // Layout
  pageLayout: 'single' | 'double' | 'magazine';
  textAlignment: 'left' | 'center' | 'justify';
  marginTop: number; // 20-60px
  marginBottom: number; // 20-60px
  marginLeft: number; // 20-80px
  marginRight: number; // 20-80px
  
  // Cover Design
  coverStyle: 'minimal' | 'modern' | 'classic' | 'bold';
  colorScheme: 'purple-pink' | 'blue-green' | 'orange-red' | 'monochrome';
  
  // Chapter Settings
  chapterTitleSize: number; // 24-36px
  chapterSpacing: number; // 30-60px
  paragraphSpacing: number; // 12-24px
}

interface ReadingPreferencesProps {
  preferences: ReadingPrefs;
  onPreferencesChange: (preferences: ReadingPrefs) => void;
  onClose: () => void;
  useTaylorSwiftThemes?: boolean;
  designSettings?: EbookDesignSettings;
}

export const ReadingPreferences = ({
  preferences,
  onPreferencesChange,
  onClose,
  useTaylorSwiftThemes = true,
  designSettings
}: ReadingPreferencesProps) => {
  const updatePreference = <K extends keyof ReadingPrefs>(
    key: K,
    value: ReadingPrefs[K]
  ) => {
    onPreferencesChange({
      ...preferences,
      [key]: value
    });
  };

  const fontSizeOptions = [
    { value: 'small', label: 'Small', preview: 'Aa' },
    { value: 'medium', label: 'Medium', preview: 'Aa' },
    { value: 'large', label: 'Large', preview: 'Aa' },
    { value: 'xl', label: 'Extra Large', preview: 'Aa' }
  ];

  const fontFamilyOptions = [
    { value: 'serif', label: 'Serif', preview: 'Serif' },
    { value: 'sans', label: 'Sans Serif', preview: 'Sans' },
    { value: 'mono', label: 'Monospace', preview: 'Mono' }
  ];

  const lineHeightOptions = [
    { value: 'tight', label: 'Tight' },
    { value: 'normal', label: 'Normal' },
    { value: 'relaxed', label: 'Relaxed' }
  ];

  const transitionOptions = [
    { value: 'slide', label: 'Slide', icon: <Zap className="h-4 w-4" /> },
    { value: 'fade', label: 'Fade', icon: <Eye className="h-4 w-4" /> },
    { value: 'none', label: 'None', icon: <Type className="h-4 w-4" /> }
  ];

  const getDesignPreviewStyles = (): React.CSSProperties => {
    if (!designSettings) return {};
    
    return {
      fontFamily: designSettings.fontFamily === 'serif' ? 'Georgia, serif' : 
                  designSettings.fontFamily === 'sans-serif' ? 'Arial, sans-serif' : 
                  'Monaco, monospace',
      fontSize: `${designSettings.fontSize}px`,
      lineHeight: designSettings.lineHeight,
      letterSpacing: `${designSettings.letterSpacing}em`,
      textAlign: designSettings.textAlignment as any,
    };
  };

  const getFontFamilyDisplayName = (family: string) => {
    switch (family) {
      case 'serif': return 'Serif (Georgia)';
      case 'sans-serif': return 'Sans Serif (Arial)';
      case 'monospace': return 'Monospace (Monaco)';
      default: return family;
    }
  };

  return (
    <Card className={cn(
      "h-full border-0 rounded-none transition-all duration-300",
      preferences.darkMode 
        ? "bg-black/40 backdrop-blur-md border-l border-white/10" 
        : "bg-white/90 backdrop-blur-md border-l border-gray-200"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "flex items-center space-x-2 text-lg",
            preferences.darkMode ? "text-white" : "text-gray-900",
            useTaylorSwiftThemes && "text-purple-700 dark:text-purple-300"
          )}>
            <Settings className="h-5 w-5" />
            <span>Reading Preferences</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={cn(
              "transition-colors",
              useTaylorSwiftThemes ? "text-purple-600 hover:text-purple-700" : "text-blue-600 hover:text-blue-700"
            )}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Design Settings Notice */}
        {designSettings && (
          <div className="flex items-start space-x-2 mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Design Settings Applied</p>
              <p>Typography settings are controlled by your ebook design. Other preferences can still be customized.</p>
            </div>
          </div>
        )}

        {/* Taylor Swift Theme Indicator */}
        {useTaylorSwiftThemes && (
          <div className="flex items-center justify-center space-x-1 mt-2 p-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
            <Heart className="h-3 w-3 text-pink-500" />
            <Star className="h-3 w-3 text-yellow-500" />
            <Music className="h-3 w-3 text-purple-500" />
            <Sparkles className="h-3 w-3 text-blue-500" />
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
              Taylor Swift Theme Active
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Typography Settings */}
        <div className="space-y-4">
          <h3 className={cn(
            "text-sm font-semibold flex items-center space-x-2",
            preferences.darkMode ? "text-gray-200" : "text-gray-700"
          )}>
            <Type className="h-4 w-4" />
            <span>Typography</span>
            {designSettings && <Lock className="h-3 w-3 text-gray-400" />}
          </h3>

          {designSettings ? (
            // Show design settings as read-only
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className={cn(
                  "text-sm flex items-center gap-2",
                  preferences.darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  Font Family
                  <Lock className="h-3 w-3 text-gray-400" />
                </Label>
                <div className={cn(
                  "px-3 py-2 rounded-md border bg-gray-50 dark:bg-gray-800/50 text-sm",
                  preferences.darkMode ? "border-white/20 text-gray-300" : "border-gray-200 text-gray-600"
                )}>
                  {getFontFamilyDisplayName(designSettings.fontFamily)}
                </div>
              </div>

              <div className="space-y-2">
                <Label className={cn(
                  "text-sm flex items-center gap-2",
                  preferences.darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  Font Size
                  <Lock className="h-3 w-3 text-gray-400" />
                </Label>
                <div className={cn(
                  "px-3 py-2 rounded-md border bg-gray-50 dark:bg-gray-800/50 text-sm",
                  preferences.darkMode ? "border-white/20 text-gray-300" : "border-gray-200 text-gray-600"
                )}>
                  {designSettings.fontSize}px
                </div>
              </div>

              <div className="space-y-2">
                <Label className={cn(
                  "text-sm flex items-center gap-2",
                  preferences.darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  Line Height
                  <Lock className="h-3 w-3 text-gray-400" />
                </Label>
                <div className={cn(
                  "px-3 py-2 rounded-md border bg-gray-50 dark:bg-gray-800/50 text-sm",
                  preferences.darkMode ? "border-white/20 text-gray-300" : "border-gray-200 text-gray-600"
                )}>
                  {designSettings.lineHeight}
                </div>
              </div>

              <div className="space-y-2">
                <Label className={cn(
                  "text-sm flex items-center gap-2",
                  preferences.darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  Text Alignment
                  <Lock className="h-3 w-3 text-gray-400" />
                </Label>
                <div className={cn(
                  "px-3 py-2 rounded-md border bg-gray-50 dark:bg-gray-800/50 text-sm capitalize",
                  preferences.darkMode ? "border-white/20 text-gray-300" : "border-gray-200 text-gray-600"
                )}>
                  {designSettings.textAlignment}
                </div>
              </div>
            </div>
          ) : (
            // Show editable preferences
            <>
              {/* Font Size */}
              <div className="space-y-2">
                <Label className={cn(
                  "text-sm",
                  preferences.darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  Font Size
                </Label>
                <Select
                  value={preferences.fontSize}
                  onValueChange={(value: ReadingPrefs['fontSize']) => updatePreference('fontSize', value)}
                >
                  <SelectTrigger className={cn(
                    "transition-colors",
                    preferences.darkMode ? "bg-black/20 border-white/20" : "bg-white border-gray-200"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontSizeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{option.label}</span>
                          <span className={cn(
                            "ml-4 font-medium",
                            option.value === 'small' && "text-sm",
                            option.value === 'medium' && "text-base",
                            option.value === 'large' && "text-lg",
                            option.value === 'xl' && "text-xl"
                          )}>
                            {option.preview}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Font Family */}
              <div className="space-y-2">
                <Label className={cn(
                  "text-sm",
                  preferences.darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  Font Family
                </Label>
                <Select
                  value={preferences.fontFamily}
                  onValueChange={(value: ReadingPrefs['fontFamily']) => updatePreference('fontFamily', value)}
                >
                  <SelectTrigger className={cn(
                    "transition-colors",
                    preferences.darkMode ? "bg-black/20 border-white/20" : "bg-white border-gray-200"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{option.label}</span>
                          <span className={cn(
                            "ml-4 text-sm",
                            option.value === 'serif' && "font-serif",
                            option.value === 'sans' && "font-sans",
                            option.value === 'mono' && "font-mono"
                          )}>
                            {option.preview}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Line Height */}
              <div className="space-y-2">
                <Label className={cn(
                  "text-sm",
                  preferences.darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  Line Spacing
                </Label>
                <Select
                  value={preferences.lineHeight}
                  onValueChange={(value: ReadingPrefs['lineHeight']) => updatePreference('lineHeight', value)}
                >
                  <SelectTrigger className={cn(
                    "transition-colors",
                    preferences.darkMode ? "bg-black/20 border-white/20" : "bg-white border-gray-200"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lineHeightOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        {/* Display Settings */}
        <div className="space-y-4">
          <h3 className={cn(
            "text-sm font-semibold flex items-center space-x-2",
            preferences.darkMode ? "text-gray-200" : "text-gray-700"
          )}>
            <Palette className="h-4 w-4" />
            <span>Display</span>
          </h3>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {preferences.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <Label className={cn(
                "text-sm",
                preferences.darkMode ? "text-gray-300" : "text-gray-600"
              )}>
                Dark Mode
              </Label>
            </div>
            <Switch
              checked={preferences.darkMode}
              onCheckedChange={(checked) => updatePreference('darkMode', checked)}
            />
          </div>

          {/* Page Transition */}
          <div className="space-y-2">
            <Label className={cn(
              "text-sm",
              preferences.darkMode ? "text-gray-300" : "text-gray-600"
            )}>
              Page Transition
            </Label>
            <Select
              value={preferences.pageTransition}
              onValueChange={(value: ReadingPrefs['pageTransition']) => updatePreference('pageTransition', value)}
            >
              <SelectTrigger className={cn(
                "transition-colors",
                preferences.darkMode ? "bg-black/20 border-white/20" : "bg-white border-gray-200"
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transitionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      {option.icon}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Accessibility Settings */}
        <div className="space-y-4">
          <h3 className={cn(
            "text-sm font-semibold flex items-center space-x-2",
            preferences.darkMode ? "text-gray-200" : "text-gray-700"
          )}>
            <Eye className="h-4 w-4" />
            <span>Accessibility</span>
          </h3>

          {/* Text to Speech */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {preferences.textToSpeech ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <Label className={cn(
                "text-sm",
                preferences.darkMode ? "text-gray-300" : "text-gray-600"
              )}>
                Text-to-Speech
              </Label>
            </div>
            <Switch
              checked={preferences.textToSpeech}
              onCheckedChange={(checked) => updatePreference('textToSpeech', checked)}
            />
          </div>

          {/* Auto Bookmark */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bookmark className="h-4 w-4" />
              <Label className={cn(
                "text-sm",
                preferences.darkMode ? "text-gray-300" : "text-gray-600"
              )}>
                Auto Bookmark
              </Label>
            </div>
            <Switch
              checked={preferences.autoBookmark}
              onCheckedChange={(checked) => updatePreference('autoBookmark', checked)}
            />
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-2">
          <Label className={cn(
            "text-sm",
            preferences.darkMode ? "text-gray-300" : "text-gray-600"
          )}>
            Preview
          </Label>
          <div className={cn(
            "p-4 rounded-lg border transition-all duration-200",
            preferences.darkMode ? "bg-black/20 border-white/20" : "bg-gray-50 border-gray-200"
          )}>
            <p className={cn(
              "transition-all duration-200",
              !designSettings && preferences.fontSize === 'small' && "text-sm",
              !designSettings && preferences.fontSize === 'medium' && "text-base",
              !designSettings && preferences.fontSize === 'large' && "text-lg",
              !designSettings && preferences.fontSize === 'xl' && "text-xl",
              !designSettings && preferences.fontFamily === 'serif' && "font-serif",
              !designSettings && preferences.fontFamily === 'sans' && "font-sans",
              !designSettings && preferences.fontFamily === 'mono' && "font-mono",
              !designSettings && preferences.lineHeight === 'tight' && "leading-tight",
              !designSettings && preferences.lineHeight === 'normal' && "leading-normal",
              !designSettings && preferences.lineHeight === 'relaxed' && "leading-relaxed",
              preferences.darkMode ? "text-gray-200" : "text-gray-800"
            )}
            style={designSettings ? getDesignPreviewStyles() : {}}
            >
              This is how your text will appear with the current settings. {designSettings ? 'The typography is controlled by your ebook design settings.' : 'You can adjust the font size, family, and spacing to your preference.'}
            </p>
          </div>
        </div>

        {/* Reset Button - Only show if no design settings */}
        {!designSettings && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onPreferencesChange({
                fontSize: 'medium',
                fontFamily: 'serif',
                lineHeight: 'normal',
                darkMode: false,
                pageTransition: 'slide',
                textToSpeech: false,
                autoBookmark: true
              });
            }}
          >
            Reset to Defaults
          </Button>
        )}
      </CardContent>
    </Card>
  );
};