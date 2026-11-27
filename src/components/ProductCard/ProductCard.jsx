import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import './ProductCard.scss';

export const LAST_PRODUCT_ID_KEY = 'dim47_last_catalog_product_id';
export const CATALOG_SCROLL_KEY = 'dim47_catalog_scroll';

export default function ProductCard({ product, onEdit }) {
  const { lang, t } = useLanguage();
  const { isAdmin, toggleBlockProduct, toggleInStock, deleteProduct } = useAdmin();

  const materialText =
    product.material?.[lang] ||
    product.material?.ua ||
    product.material?.en ||
    '';

  const titleText =
    product.title?.[lang] ||
    product.title?.ua ||
    product.title?.en ||
    '';

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
      `Видалити модель «${titleText}»? Цю дію неможливо скасувати.`
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
            alt={titleText}
            className="product-card__img"
            loading="lazy"
          />

          {product.inStock && (
            <span
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                color: '#15803d',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '999px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                border: '1px solid #bbf7d0',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.25)',
                  flexShrink: 0,
                }}
              />
              {lang === 'ua' ? 'Наявність' : 'In stock'}
            </span>
          )}

          {isAdmin && product.isBlocked && (
            <span
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: '#e84393',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              Заблоковано
            </span>
          )}
        </div>

        <div className="product-card__body">
          {materialText && (
            <p className="product-card__material">{materialText}</p>
          )}
          <h3 className="product-card__title">{titleText}</h3>
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
            onClick={() => toggleInStock(product.id)}
            style={{
              width: '100%',
              padding: '5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: product.inStock ? '#dcfce7' : '#fff',
              color: product.inStock ? '#15803d' : '#475569',
              border: product.inStock ? '1px solid #86efac' : '1px solid #cbd5e1',
            }}
          >
            {product.inStock ? '● В наявності' : '○ Позначити як наявність'}
          </button>

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