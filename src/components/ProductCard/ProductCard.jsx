import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import './ProductCard.scss';

export const LAST_PRODUCT_ID_KEY = 'dim47_last_catalog_product_id';
export const CATALOG_SCROLL_KEY = 'dim47_catalog_scroll';

export default function ProductCard({ product, onEdit }) {
  const { lang, t } = useLanguage();
  const { isAdmin, toggleBlockProduct, deleteProduct } = useAdmin();

  const handleOpenProduct = () => {
    try {
      sessionStorage.setItem(LAST_PRODUCT_ID_KEY, String(product.id));
      sessionStorage.setItem(CATALOG_SCROLL_KEY, String(window.scrollY || 0));
    } catch {
      // ігноруємо помилки sessionStorage
    }
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Видалити модель «${product.title[lang]}»? Цю дію неможливо скасувати.`
    );
    if (confirmed) {
      deleteProduct(product.id);
    }
  };

  return (
    <div
      data-product-id={product.id}
      className="product-card"
      style={{ opacity: product.isBlocked ? 0.55 : 1 }}
    >
      <Link
        to={`/product/${product.id}`}
        className="product-card__link"
        onClick={handleOpenProduct}
      >
        <div className="product-card__media">
          <img
            src={product.image}
            alt={product.title[lang]}
            className="product-card__img"
            loading="lazy"
          />
          {isAdmin && product.isBlocked && (
            <span
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: '#e84393',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              Заблоковано
            </span>
          )}
        </div>

        <div className="product-card__body">
          <p className="product-card__material">{product.material[lang]}</p>
          <h3 className="product-card__title">{product.title[lang]}</h3>
          <div className="product-card__footer">
            <span className="product-card__price">
              {product.price.toLocaleString('uk-UA')} {t.currency}
            </span>
            <span className="product-card__sizes">
              {product.sizes[0]}–{product.sizes[product.sizes.length - 1]}
            </span>
          </div>
        </div>
      </Link>

      {isAdmin && (
        <div
          style={{
            padding: '8px 12px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            backgroundColor: '#f8fafc',
          }}
        >
          <button
            type="button"
            onClick={() => toggleBlockProduct(product.id)}
            style={{
              flex: 1,
              padding: '5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: product.isBlocked ? '#e84393' : '#fee2e2',
              color: product.isBlocked ? '#fff' : '#b91c1c',
            }}
          >
            {product.isBlocked ? 'Розблокувати' : 'В блок'}
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(product)}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                color: '#334155',
              }}
            >
              Редагувати
            </button>
          )}

          <button
            type="button"
            onClick={handleDelete}
            style={{
              width: '100%',
              padding: '5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#ef4444',
              color: '#fff',
            }}
          >
            Видалити
          </button>
        </div>
      )}
    </div>
  );
}