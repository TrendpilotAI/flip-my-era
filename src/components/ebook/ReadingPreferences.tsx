import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadingPrefs {
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  fontFamily: 'serif' | 'sans' | 'mono';
  lineHeight: 'tight' | 'normal' | 'relaxed';
  darkMode: boolean;
  pageTransition: 'slide' | 'fade' | 'flip';
  textToSpeech: boolean;
  autoBookmark: boolean;
}

interface ReadingPreferencesProps {
  preferences: ReadingPrefs;
  onPreferencesChange: (preferences: ReadingPrefs) => void;
  onClose: () => void;
  useTaylorSwiftThemes?: boolean;
}

export const ReadingPreferences = ({
  preferences,
  onPreferencesChange,
  onClose,
  useTaylorSwiftThemes = true
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
    { value: 'flip', label: 'Page Flip', icon: <Type className="h-4 w-4" /> }
  ];

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
          </h3>

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
              preferences.fontSize === 'small' && "text-sm",
              preferences.fontSize === 'medium' && "text-base",
              preferences.fontSize === 'large' && "text-lg",
              preferences.fontSize === 'xl' && "text-xl",
              preferences.fontFamily === 'serif' && "font-serif",
              preferences.fontFamily === 'sans' && "font-sans",
              preferences.fontFamily === 'mono' && "font-mono",
              preferences.lineHeight === 'tight' && "leading-tight",
              preferences.lineHeight === 'normal' && "leading-normal",
              preferences.lineHeight === 'relaxed' && "leading-relaxed",
              preferences.darkMode ? "text-gray-200" : "text-gray-800"
            )}>
              This is how your text will appear with the current settings. You can adjust the font size, family, and spacing to your preference.
            </p>
          </div>
        </div>

        {/* Reset Button */}
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
      </CardContent>
    </Card>
  );
};