import { ArtistSurvey } from "@/modules/shared/components/ArtistSurvey";
import { useTheme } from "@/modules/shared/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";

const Survey = () => {
  const { setArtistTheme } = useTheme();
  const navigate = useNavigate();

  const handleArtistSelect = (artistId: string) => {
    setArtistTheme(artistId);
    navigate('/');
  };

  return <ArtistSurvey onArtistSelect={handleArtistSelect} />;
};

export default Survey;