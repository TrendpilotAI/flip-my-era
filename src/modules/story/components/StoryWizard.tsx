import { useState } from "react";
import { Input } from '@/modules/shared/components/ui/input';
import { Button } from '@/modules/shared/components/ui/button';
import { Textarea } from '@/modules/shared/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Progress } from '@/modules/shared/components/ui/progress';
import { Loader2, Sparkles, User, MapPin, Calendar, BookOpen, ArrowLeft, ArrowRight, Zap } from "lucide-react";
import { StarSignDisplay } from "@/modules/user/components/StarSignDisplay";
import { PersonalitySelector } from "@/modules/user/components/PersonalitySelector";
import { RadioGroup, RadioGroupItem } from '@/modules/shared/components/ui/radio-group';
import { Label } from '@/modules/shared/components/ui/label';
import type { PersonalityTypeKey } from '@/modules/story/types/personality';
import { personalityTypes } from '@/modules/story/types/personality';

type GenderType = "same" | "flip" | "neutral";

interface StoryWizardProps {
  name: string;
  setName: (name: string) => void;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  loading: boolean;
  handleSubmit: () => void;
  personalityType: PersonalityTypeKey;
  setPersonalityType: (type: PersonalityTypeKey) => void;
  gender: GenderType;
  setGender: (gender: GenderType) => void;
  location: string;
  setLocation: (location: string) => void;
  characterDescription: string;
  setCharacterDescription: (description: string) => void;
  plotDescription: string;
  setPlotDescription: (description: string) => void;
}

type WizardStep = 'character' | 'story' | 'generate';

const StoryWizard = ({
  name,
  setName,
  date,
  setDate,
  loading,
  handleSubmit,
  personalityType,
  setPersonalityType,
  gender,
  setGender,
  location,
  setLocation,
  characterDescription,
  setCharacterDescription,
  plotDescription,
  setPlotDescription
}: StoryWizardProps) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('character');

  const steps: { key: WizardStep; title: string; description: string; icon: React.ReactNode }[] = [
    {
      key: 'character',
      title: 'Character Basics',
      description: 'Tell us about your main character',
      icon: <User className="h-5 w-5" />
    },
    {
      key: 'story',
      title: 'Story Details',
      description: 'Describe your character and plot',
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      key: 'generate',
      title: 'Generate Story',
      description: 'Create your alternate timeline',
      icon: <Zap className="h-5 w-5" />
    }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.valueAsDate;
    setDate(selectedDate || undefined);
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'character':
        return name.trim() && location.trim() && date;
      case 'story':
        return characterDescription.trim() && plotDescription.trim();
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep === 'character' && canProceedToNext()) {
      setCurrentStep('story');
    } else if (currentStep === 'story' && canProceedToNext()) {
      setCurrentStep('generate');
    }
  };

  const handlePrevious = () => {
    if (currentStep === 'story') {
      setCurrentStep('character');
    } else if (currentStep === 'generate') {
      setCurrentStep('story');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'character':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-purple-500" />
                  Main Character Name
                </Label>
                <Input 
                  placeholder="Enter your character's name" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="text-base py-3"
                />
              </div>

              <div>
                <Label className="text-base font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-purple-500" />
                  Story Location
                </Label>
                <Input 
                  placeholder="Where does your story take place? (e.g., Paris, New York, Tokyo)" 
                  value={location} 
                  onChange={e => setLocation(e.target.value)} 
                  className="text-base py-3"
                />
              </div>

              <div>
                <Label className="text-base font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  Birthdate
                </Label>
                <div className="space-y-3">
                  <Input 
                    type="date" 
                    onChange={handleDateChange} 
                    className="text-base py-3" 
                    max={new Date().toISOString().split('T')[0]} 
                  />
                  {date && <StarSignDisplay date={date} />}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium text-gray-700 flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Gender in Your Story
                </Label>
                <RadioGroup 
                  value={gender} 
                  onValueChange={(value: GenderType) => setGender(value)} 
                  className="grid grid-cols-3 gap-3"
                >
                  <div className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-purple-50">
                    <RadioGroupItem value="same" id="same" />
                    <Label htmlFor="same" className="cursor-pointer">Keep Same</Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-purple-50">
                    <RadioGroupItem value="flip" id="flip" />
                    <Label htmlFor="flip" className="cursor-pointer">Flip It!</Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-purple-50">
                    <RadioGroupItem value="neutral" id="neutral" />
                    <Label htmlFor="neutral" className="cursor-pointer">Gender Neutral</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        );

      case 'story':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-purple-500" />
                  Character Description
                </Label>
                <Textarea 
                  placeholder="Describe your character's personality, traits, and background. What makes them unique?"
                  value={characterDescription}
                  onChange={e => setCharacterDescription(e.target.value)}
                  className="text-base py-3 min-h-[120px] resize-none"
                />
              </div>

              <div>
                <Label className="text-base font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  Plot Description
                </Label>
                <Textarea 
                  placeholder="Describe the plot or scenario you want to explore. What happens in this alternate timeline?"
                  value={plotDescription}
                  onChange={e => setPlotDescription(e.target.value)}
                  className="text-base py-3 min-h-[120px] resize-none"
                />
              </div>

              <div>
                <Label className="text-base font-medium text-gray-700 flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Personality Type
                </Label>
                <PersonalitySelector 
                  personalityTypes={personalityTypes} 
                  selectedType={personalityType} 
                  onSelect={setPersonalityType} 
                />
              </div>
            </div>
          </div>
        );

      case 'generate':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-8 w-8 text-purple-500" />
                <h3 className="text-2xl font-bold text-gray-900">Ready to Generate Your Story</h3>
                <Sparkles className="h-8 w-8 text-purple-500" />
              </div>
              
              <div className="bg-purple-50 rounded-lg p-6 space-y-4">
                <h4 className="font-semibold text-gray-900">Story Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Character:</span> {name}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span> {location}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Birthdate:</span> {date?.toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Personality:</span> {personalityTypes[personalityType]?.name}
                  </div>
                </div>
              </div>

              <p className="text-gray-600">
                Click the button below to generate your alternate timeline story using AI.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white/95 backdrop-blur-lg border border-white/20 shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-purple-500" />
            <CardTitle className="text-2xl font-bold text-gray-900">
              {steps[currentStepIndex].title}
            </CardTitle>
            <Sparkles className="h-6 w-6 text-purple-500" />
          </div>
          <CardDescription className="text-lg text-gray-600">
            {steps[currentStepIndex].description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {currentStepIndex + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 'character'}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep === 'generate' ? (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Story...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Generate Story
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryWizard; 