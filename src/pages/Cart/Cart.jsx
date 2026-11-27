import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';

export default function Cart() {
  const { lang, t } = useLanguage();
  const { cartItems, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();

  if (!cartItems.length) {
    return (
      <section style={{ padding: '40px 16px', maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '12px' }}>
          {lang === 'ua' ? 'Кошик' : 'Cart'}
        </h1>
        <p style={{ marginBottom: '20px', color: '#64748b' }}>
          {lang === 'ua' ? 'Ваш кошик наразі порожній.' : 'Your cart is currently empty.'}
        </p>
        <Link
          to="/catalog"
          style={{
            display: 'inline-block',
            padding: '10px 22px',
            borderRadius: '999px',
            backgroundColor: '#8cbff0',
            color: '#fbf3d1',
            fontWeight: 600,
          }}
        >
          {lang === 'ua' ? 'Перейти в каталог' : 'Go to catalog'}
        </Link>
      </section>
    );
  }

  return (
    <section style={{ padding: '28px 16px 64px', maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700 }}>
          {lang === 'ua' ? 'Кошик' : 'Cart'}
        </h1>
        <button
          type="button"
          onClick={clearCart}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          {lang === 'ua' ? 'Очистити' : 'Clear'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {cartItems.map((item) => {
          const itemTitle = item.title?.[lang] || item.title?.ua || '';
          const colorLabel = item.colorName?.[lang] || item.colorName?.ua || '';
          const soleColorLabel = item.soleColorName?.[lang] || item.soleColorName?.ua || '';
          const materialLabel = item.materialLabel?.[lang] || item.material || '';
          const liningLabel = item.liningLabel?.[lang] || item.lining || '';

          return (
            <div
              key={item.cartItemKey}
              style={{
                display: 'flex',
                gap: '14px',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                alignItems: 'center',
              }}
            >
              <img
                src={item.image}
                alt={itemTitle}
                style={{
                  width: '76px',
                  height: '92px',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  flexShrink: 0,
                  backgroundColor: '#f4f4f5',
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <strong style={{ fontSize: '16px', color: '#1e293b' }}>{itemTitle}</strong>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.cartItemKey)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#fee2e2',
                      color: '#b91c1c',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Видалити позицію"
                  >
                    ×
                  </button>
                </div>

                <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                  {[
                    materialLabel,
                    liningLabel,
                    colorLabel,
                    soleColorLabel
                      ? `${lang === 'ua' ? 'Підошва' : 'Sole'}: ${soleColorLabel}`
                      : '',
                    `${lang === 'ua' ? 'Розмір' : 'Size'}: ${item.size} EU`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>

                {item.isNonReturnable && (
                  <p
                    style={{
                      marginTop: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#b45309',
                      backgroundColor: '#fef3c7',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      display: 'inline-block',
                    }}
                  >
                    {lang === 'ua' ? 'Без обміну і повернення' : 'Non-returnable & non-exchangeable'}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', gap: '10px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartItemKey, item.quantity - 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#f8fafc',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      −
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: 600, minWidth: '18px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartItemKey, item.quantity + 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#f8fafc',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>

                  <strong style={{ fontSize: '15px', color: '#1e293b' }}>
                    {((Number(item.price) || 0) * item.quantity).toLocaleString('uk-UA')} {t.currency}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: 600 }}>
          {lang === 'ua' ? 'Разом:' : 'Total:'}
        </span>
        <strong style={{ fontSize: '20px', fontWeight: 700 }}>
          {totalPrice.toLocaleString('uk-UA')} {t.currency}
        </strong>
      </div>
    </section>
  );
}