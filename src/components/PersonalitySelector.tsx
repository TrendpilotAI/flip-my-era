import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { PersonalityTypeKey } from "@/types/personality";
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
  return <div className="space-y-4">
      <label className="block text-base font-medium text-[#4A4A4A]">Choose Your Character's Energy
    </label>
      <RadioGroup value={selectedType} onValueChange={(value: PersonalityTypeKey) => onSelect(value)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(personalityTypes).map(([key, type]) => <div key={key} className={`flex flex-col space-y-2 rounded-lg border p-4 cursor-pointer transition-colors ${selectedType === key ? "border-[#E5DEFF] bg-[#E5DEFF]/20" : "border-gray-200 hover:border-[#E5DEFF]/50"}`}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={key as PersonalityTypeKey} id={key} />
              <Label htmlFor={key} className="cursor-pointer font-semibold">
                {type.title}
              </Label>
            </div>
            <p className="text-sm text-gray-600 ml-6">{type.description}</p>
            <div className="ml-6 flex flex-wrap gap-2">
              {type.traits.map((trait, index) => <span key={index} className="text-xs bg-[#E5DEFF]/30 text-purple-700 px-2 py-1 rounded-full">
                  {trait}
                </span>)}
            </div>
          </div>)}
      </RadioGroup>
    </div>;
};