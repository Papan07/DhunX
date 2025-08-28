import './Navigation.css';

const HamburgerMenu = ({ onToggle, isVisible }) => {
  if (!isVisible) return null;

  return (
    <button
      className="hamburger-menu"
      onClick={onToggle}
      aria-label="Show sidebar"
    >
      <span className="hamburger-icon">›</span>
    </button>
  );
};

export default HamburgerMenu;
