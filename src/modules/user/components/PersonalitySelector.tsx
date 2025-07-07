import { RadioGroup, RadioGroupItem } from '@/modules/shared/components/ui/radio-group';
import { Label } from '@/modules/shared/components/ui/label';
import { Sparkles } from "lucide-react";
import type { PersonalityTypeKey } from '@/modules/story/types/personality';

interface PersonalityType {
  title: string;
  traits: string[];
  description: string;
}

interface PersonalityTypes {
  [key: string]: PersonalityType;
}

interface PersonalitySelectorProps {
  personalityTypes: PersonalityTypes;
  selectedType: PersonalityTypeKey;
  onSelect: (value: PersonalityTypeKey) => void;
}

export const PersonalitySelector = ({
  personalityTypes,
  selectedType,
  onSelect
}: PersonalitySelectorProps) => {
  return (
    <div className="space-y-4">
      <label className="block text-base font-medium text-[#4A4A4A] flex items-center gap-2">
        <span>Choose Your Character's Energy</span>
        <Sparkles className="h-4 w-4 text-purple-500" />
      </label>
      <RadioGroup 
        value={selectedType} 
        onValueChange={(value: PersonalityTypeKey) => onSelect(value)} 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {Object.entries(personalityTypes).map(([key, type]) => (
          <div
            key={key}
            className={`flex flex-col space-y-2 rounded-lg border p-4 cursor-pointer transition-all duration-300 hover:scale-102 hover:shadow-md
              ${selectedType === key ? "border-[#E5DEFF] bg-[#E5DEFF]/20" : "border-gray-200 hover:border-[#E5DEFF]/50"}`}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={key as PersonalityTypeKey} id={key} />
              <Label htmlFor={key} className="cursor-pointer font-semibold">
                {type.title}
              </Label>
            </div>
            <p className="text-sm text-gray-600 ml-6">
              {type.description}
            </p>
            <div className="ml-6 flex flex-wrap gap-2">
              {type.traits.map((trait, index) => (
                <span 
                  key={index} 
                  className="text-xs bg-[#E5DEFF]/30 text-purple-700 px-2 py-1 rounded-full"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
