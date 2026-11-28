import { useTheme } from "@/context/ThemeContext";
import whiteLogo from "@/assets/ohmic-white-logo.png";
import blackLogo from "@/assets/ohmic-black-logo.png";

const Logo = ({ className = "h-8 w-auto" }) => {
  const { theme } = useTheme();
  return (
    <img
      src={theme === "dark" ? whiteLogo : blackLogo}
      alt="Ohmic"
      className={className}
    />
  );
};

export default Logo;