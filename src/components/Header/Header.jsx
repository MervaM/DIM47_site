import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { useCart } from '../../context/CartContext';
import './Header.scss';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, setLang, t, gender, toggleGender } = useLanguage();
  const { isAdmin } = useAdmin();
  const { totalCount } = useCart();

  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    return () => clearTimeout(clickTimerRef.current);
  }, []);

  const handleLogoClick = (e) => {
    clickCountRef.current += 1;
    clearTimeout(clickTimerRef.current);

    if (clickCountRef.current >= 3) {
      e.preventDefault();
      clickCountRef.current = 0;
      navigate('/admin');
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 600);
  };

  const noticeText =
    lang === 'en'
      ? 'Production time: 9–14 business days. Saturday and Sunday are days off.'
      : 'Терміни пошиття: 9-14 робочих днів. Субота і неділя - вихідні дні.';

  const headerClasses = [
    'header',
    isMenuOpen ? 'is-menu-open' : '',
    isAdmin ? 'has-admin-bar' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={headerClasses}>
      <div className="header__notice">
        <div className="container header__notice-inner">{noticeText}</div>
      </div>

      <div className="container header__inner">
        <button
          type="button"
          className={`header__burger ${isMenuOpen ? 'is-active' : ''}`}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={isMenuOpen ? t.closeMenu : t.openMenu}
          aria-expanded={isMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <Link
          to="/"
          className="header__logo"
          aria-label="DiM47"
          onClick={handleLogoClick}
        >
          <svg
            viewBox="0 0 250 74"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="header__logo-svg"
          >
            <path
              d="M12 24H36C45 24 51 30 51 41C51 52 45 58 36 58H12V24Z"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
            <circle cx="67" cy="24" r="2.8" fill="currentColor" />
            <line
              x1="67"
              y1="34"
              x2="67"
              y2="58"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <path
              d="M85 58V24L104 43L123 24V58"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M162 58V24L138 48H169"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M179 24H209L190 58"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M226 32C226 32 235 22.5 235 16C235 11.0294 230.971 7 226 7C221.029 7 217 11.0294 217 16C217 22.5 226 32 226 32Z"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            <circle cx="226" cy="16" r="2.8" fill="currentColor" />
          </svg>
        </Link>

        <nav
          id="mobile-header-nav"
          aria-label="Primary navigation"
          className={`header__nav ${isMenuOpen ? 'is-open' : ''}`}
        >
          <ul className="header__list">
            <li>
              <NavLink to="/" className="header__link" end>
                {t.home}
              </NavLink>
            </li>
            <li>
              <Link
                to="/catalog"
                className={`header__link ${
                  location.pathname === '/catalog' && !location.search
                    ? 'active'
                    : ''
                }`}
              >
                {t.catalog}
              </Link>
            </li>
            <li>
              <Link
                to="/catalog?inStock=true"
                className={`header__link ${
                  location.search === '?inStock=true' ? 'active' : ''
                }`}
              >
                {t.inStock}
              </Link>
            </li>
            <li>
              <NavLink to="/constructor" className="header__link">
                {t.constructor}
              </NavLink>
            </li>
          </ul>

          <div className="header__gender">
            <button
              type="button"
              onClick={() => toggleGender('women')}
              className={`header__gender-btn header__gender-btn--women ${
                gender === 'women' ? 'is-active' : ''
              }`}
              aria-label={t.women}
              title={t.women}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="5" />
                <line x1="12" y1="13" x2="12" y2="21" />
                <line x1="9" y1="18" x2="15" y2="18" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => toggleGender('men')}
              className={`header__gender-btn header__gender-btn--men ${
                gender === 'men' ? 'is-active' : ''
              }`}
              aria-label={t.men}
              title={t.men}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="10" cy="14" r="5" />
                <line x1="14" y1="10" x2="20" y2="4" />
                <polyline points="15 4 20 4 20 9" />
              </svg>
            </button>
          </div>

          <div className="header__lang">
            <button
              type="button"
              className={`header__lang-btn ${lang === 'ua' ? 'is-active' : ''}`}
              onClick={() => setLang('ua')}
            >
              UA
            </button>
            <span className="header__lang-divider">/</span>
            <button
              type="button"
              className={`header__lang-btn ${lang === 'en' ? 'is-active' : ''}`}
              onClick={() => setLang('en')}
            >
              EN
            </button>
          </div>
        </nav>

        {isMenuOpen && (
          <div
            className="header__backdrop"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        <Link to="/cart" className="header__cart" aria-label={t.cartAria}>
          <svg
            width="23"
            height="23"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span className="header__cart-badge">{totalCount}</span>
        </Link>
      </div>
    </header>
  );
}