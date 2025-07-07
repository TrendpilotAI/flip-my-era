import { useState } from "react";
import { getStarSign } from "@/modules/user/utils/starSigns";
import { starSignCharacteristics } from "@/modules/user/utils/starSigns";

interface StarSignDisplayProps {
  date: Date;
}

const StarSignIcon = ({ sign }: { sign: string }) => {
  const commonClasses = "w-12 h-12 text-purple-600";
  
  return (
    <div className="flex items-center justify-center">
      <svg className={commonClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {sign === "Aries" && (
          <path d="M12 2 C 8 8, 8 16, 12 20 M12 2 C 16 8, 16 16, 12 20 M12 20 L12 22" />
        )}
        {sign === "Taurus" && (
          <path d="M6 4 C 10 4, 12 8, 12 12 C 12 16, 10 20, 6 20 M18 4 C 14 4, 12 8, 12 12" />
        )}
        {sign === "Gemini" && (
          <path d="M6 4 L6 20 M18 4 L18 20 M6 12 L18 12" />
        )}
        {sign === "Cancer" && (
          <path d="M12 2 C 6 2, 6 12, 12 12 C 18 12, 18 22, 12 22" />
        )}
        {sign === "Leo" && (
          <path d="M12 2 C 6 2, 6 12, 12 12 C 18 12, 18 2, 12 2 M12 12 L12 22" />
        )}
        {sign === "Virgo" && (
          <path d="M6 4 C 12 4, 12 20, 18 20" />
        )}
        {sign === "Libra" && (
          <path d="M6 12 L18 12 M12 12 L12 20 M8 16 L16 16" />
        )}
        {sign === "Scorpio" && (
          <path d="M6 12 C 12 12, 12 20, 18 20 M18 20 L20 18 L18 16" />
        )}
        {sign === "Sagittarius" && (
          <path d="M6 18 L18 6 M18 6 L14 6 M18 6 L18 10" />
        )}
        {sign === "Capricorn" && (
          <path d="M6 4 C 12 4, 12 20, 18 20" />
        )}
        {sign === "Aquarius" && (
          <path d="M6 12 L18 12 M6 16 L18 16" />
        )}
        {sign === "Pisces" && (
          <path d="M6 12 C 10 12, 10 4, 6 4 C 2 4, 2 12, 6 12 M18 12 C 14 12, 14 20, 18 20 C 22 20, 22 12, 18 12 M6 12 L18 12" />
        )}
      </svg>
    </div>
  );
};

export const StarSignDisplay = ({ date }: StarSignDisplayProps) => {
  const starSign = getStarSign(date);
  
  if (!starSign) return null;

  return (
    <div className="mt-6 text-center animate-fadeIn">
      <div className="text-lg font-medium text-[#4A4A4A]">Your Star Sign</div>
      <div className="flex items-center justify-center gap-8 mt-4">
        <div className="w-1/3">
          <StarSignIcon sign={starSign} />
          <div className="mt-2 text-2xl font-bold bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] text-transparent bg-clip-text">
            {starSign}
          </div>
        </div>
        <div className="w-2/3 text-left">
          <ul className="list-disc list-inside space-y-2">
            {starSignCharacteristics[starSign].traits.map((trait, index) => (
              <li key={index} className="text-[#4A4A4A]">{trait}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
