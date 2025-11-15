import { useNavigate, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const Logo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const handleLogoClick = () => {
    if (!isHomePage) {
      navigate("/");
    }
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div
        className="flex justify-center md:justify-start flex-1 md:flex-none"
        onClick={handleLogoClick}
        style={{ cursor: isHomePage ? "default" : "pointer" }}
      >
        <img
          src="/logo-light.svg"
          alt="Logo"
          className="h-[2.5rem] md:h-[3rem] dark:hidden"
        />
        <img
          src="/logo-dark.svg"
          alt="Logo"
          className="h-[2.5rem] md:h-[3rem] hidden dark:block"
        />
      </div>
      <ThemeToggle />
    </div>
  );
};

export default Logo;
