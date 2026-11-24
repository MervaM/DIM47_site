import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import './Product.scss';

const compressImageFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 800;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const {
    isAdmin,
    items,
    manufacturers,
    toggleInStock,
    toggleBlockSize,
    toggleProductColorBlock,
    updateProduct,
  } = useAdmin();

  const product = items.find((item) => item.id === id);

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState('leather');
  const [selectedLining, setSelectedLining] = useState('fleece'); // 'fleece' = байка, 'fur' = хутро
  const [showAllColors, setShowAllColors] = useState(false);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [addedToast, setAddedToast] = useState(false);

  const mfr = manufacturers[product?.manufacturerId] || manufacturers.m1;
  const activeSole = mfr?.soles?.find((s) => s.id === product?.soleId) || mfr?.soles?.[0];
  const soleBlockedSizes = activeSole?.blockedSizes || [];

  const availableMaterials = product?.availableMaterials || ['leather', 'suede'];
  const availableLinings = product?.availableLinings || ['fleece', 'fur'];

  const paletteColors = mfr?.palettes?.[selectedMaterial] || [];
  const basicColors = paletteColors.filter((c) => c.isBasic);
  const visibleColors = showAllColors
    ? paletteColors
    : basicColors.length > 0
    ? basicColors
    : paletteColors;
  const hasMoreColors = paletteColors.length > visibleColors.length;

  const blockedSizes = product?.blockedSizes || [];
  const blockedColorIds = product?.blockedColorIds || [];

  const gallery = product?.gallery?.length
    ? product.gallery
    : product?.image
    ? [product.image]
    : [];

  useEffect(() => {
    if (!product) return;
    setActivePhotoIdx(0);
    setShowAllColors(false);
    const firstMat = availableMaterials[0] || 'leather';
    setSelectedMaterial(firstMat);
    const firstLin = availableLinings[0] || 'fleece';
    setSelectedLining(firstLin);
  }, [product?.id]);

  useEffect(() => {
    const firstValidColor = paletteColors.find(
      (c) => !c.isBlocked && !blockedColorIds.includes(c.id)
    );
    setSelectedColorId(firstValidColor ? firstValidColor.id : null);
  }, [selectedMaterial, product?.id, mfr?.id]);

  if (!product || (!isAdmin && product.isBlocked)) {
    return (
      <section className="container" style={{ paddingBlock: '64px', textAlign: 'center' }}>
        <p style={{ marginBottom: '16px', fontSize: '18px' }}>
          {lang === 'ua' ? 'Модель не знайдена або тимчасово недоступна.' : 'Product not found.'}
        </p>
        <Link
          to="/catalog"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            borderRadius: '999px',
            backgroundColor: '#8cbff0',
            color: '#fbf3d1',
            fontWeight: 600,
          }}
        >
          {lang === 'ua' ? 'Повернутися в каталог' : 'Back to catalog'}
        </Link>
      </section>
    );
  }

  const activeColor = paletteColors.find((c) => c.id === selectedColorId);

  const handleSelectColor = (color) => {
    if (!color.isBasic) {
      setShowAllColors(true);
    }
    setSelectedColorId(color.id);
    setErrorMsg('');
  };

  const handleAddGalleryPhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const compressed = await Promise.all(files.map((f) => compressImageFile(f)));
    const updatedGallery = [...gallery, ...compressed];
    updateProduct(product.id, {
      image: updatedGallery[0],
      gallery: updatedGallery,
    });
  };

  const handleRemovePhoto = (idxToRemove) => {
    if (gallery.length <= 1) return;
    const updatedGallery = gallery.filter((_, idx) => idx !== idxToRemove);
    updateProduct(product.id, {
      image: updatedGallery[0],
      gallery: updatedGallery,
    });
    setActivePhotoIdx(0);
  };

  const handleChangeProductManufacturer = (newMfrId) => {
    const nextMfr = manufacturers[newMfrId];
    const firstSole = nextMfr?.soles?.[0];
    updateProduct(product.id, {
      manufacturerId: newMfrId,
      soleId: firstSole?.id || '',
      sizes: firstSole ? firstSole.sizes : product.sizes,
      blockedSizes: [],
      blockedColorIds: [],
    });
  };

  const handleChangeProductSole = (newSoleId) => {
    const nextSole = mfr?.soles?.find((s) => s.id === newSoleId);
    updateProduct(product.id, {
      soleId: newSoleId,
      sizes: nextSole ? nextSole.sizes : product.sizes,
      blockedSizes: [],
    });
  };

  const toggleLiningAvailability = (liningKey) => {
    const exists = availableLinings.includes(liningKey);
    if (exists && availableLinings.length === 1) return;
    const updated = exists
      ? availableLinings.filter((l) => l !== liningKey)
      : [...availableLinings, liningKey];
    updateProduct(product.id, { availableLinings: updated });
    if (!updated.includes(selectedLining)) {
      setSelectedLining(updated[0]);
    }
  };

  const handleAddToCart = () => {
    if (!selectedColorId) {
      setErrorMsg(lang === 'ua' ? 'Оберіть доступний колір' : 'Select an available color');
      return;
    }
    if (!selectedSize) {
      setErrorMsg(lang === 'ua' ? 'Будь ласка, оберіть розмір' : 'Please select a size');
      return;
    }

    setErrorMsg('');
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  return (
    <section className="product-page">
      <div className="container">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="product-page__back"
        >
          ← {lang === 'ua' ? 'Назад' : 'Back'}
        </button>

        <div className="product-page__grid">
          <div className="product-page__gallery">
            <div className="product-page__media">
              <img
                src={gallery[activePhotoIdx] || product.image}
                alt={product.title[lang]}
                className="product-page__img"
              />
            </div>

            <div className="product-page__thumbs">
              {gallery.map((photoUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`product-page__thumb ${activePhotoIdx === idx ? 'is-active' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={photoUrl} alt={`${product.title[lang]} ${idx + 1}`} />
                  {isAdmin && gallery.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(idx);
                      }}
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(239,68,68,0.9)',
                        color: '#fff',
                        fontSize: '11px',
                        lineHeight: 1,
                      }}
                      title="Видалити фото"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {isAdmin && (
                <label className="product-page__thumb-add" title="Додати фото">
                  +
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddGalleryPhoto}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="product-page__info">
            <div>
              <h1 className="product-page__title">{product.title[lang]}</h1>
              <p className="product-page__price">
                {product.price.toLocaleString('uk-UA')} {t.currency}
              </p>
            </div>

            {/* Шкіра / Замша (без слова "Матеріал") */}
            <div className="product-page__section">
              <div className="product-page__materials">
                {availableMaterials.includes('leather') && (
                  <button
                    type="button"
                    onClick={() => setSelectedMaterial('leather')}
                    className={`product-page__material-btn ${
                      selectedMaterial === 'leather' ? 'is-active' : ''
                    }`}
                  >
                    {lang === 'ua' ? 'Шкіра' : 'Leather'}
                  </button>
                )}
                {availableMaterials.includes('suede') && (
                  <button
                    type="button"
                    onClick={() => setSelectedMaterial('suede')}
                    className={`product-page__material-btn ${
                      selectedMaterial === 'suede' ? 'is-active' : ''
                    }`}
                  >
                    {lang === 'ua' ? 'Замша' : 'Suede'}
                  </button>
                )}
              </div>
            </div>

            {/* Вибір утеплювача: Байка / Хутро */}
            <div className="product-page__section">
              <div className="product-page__materials">
                {availableLinings.includes('fleece') && (
                  <button
                    type="button"
                    onClick={() => setSelectedLining('fleece')}
                    className={`product-page__material-btn ${
                      selectedLining === 'fleece' ? 'is-active' : ''
                    }`}
                  >
                    {lang === 'ua' ? 'Байка' : 'Fleece'}
                  </button>
                )}
                {availableLinings.includes('fur') && (
                  <button
                    type="button"
                    onClick={() => setSelectedLining('fur')}
                    className={`product-page__material-btn ${
                      selectedLining === 'fur' ? 'is-active' : ''
                    }`}
                  >
                    {lang === 'ua' ? 'Хутро' : 'Fur'}
                  </button>
                )}
              </div>
            </div>

            {/* Кольори: базові одразу + кнопка розкриття всієї палітри */}
            <div className="product-page__section">
              <div className="product-page__label">
                <span>{lang === 'ua' ? 'Колір' : 'Color'}</span>
                <span className="product-page__label-value">
                  {activeColor?.name?.[lang] || ''}
                </span>
              </div>

              <div className="product-page__colors" style={{ alignItems: 'center' }}>
                {visibleColors.map((color) => {
                  const isColorBlocked =
                    color.isBlocked || blockedColorIds.includes(color.id);
                  return (
                    <button
                      key={color.id}
                      type="button"
                      disabled={isColorBlocked}
                      title={color.name[lang]}
                      onClick={() => handleSelectColor(color)}
                      className={`product-page__color-btn ${
                        selectedColorId === color.id ? 'is-selected' : ''
                      } ${isColorBlocked ? 'is-blocked' : ''}`}
                    >
                      <span
                        className="product-page__color-circle"
                        style={{ backgroundColor: color.hex }}
                      />
                    </button>
                  );
                })}

                {(hasMoreColors || showAllColors) && (
                  <button
                    type="button"
                    onClick={() => setShowAllColors((prev) => !prev)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: showAllColors ? '#eef6ff' : '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#2b4c6f',
                    }}
                  >
                    {showAllColors
                      ? lang === 'ua'
                        ? 'Згорнути палітру'
                        : 'Show basic'
                      : lang === 'ua'
                      ? `+ Більше кольорів (${paletteColors.length})`
                      : `+ More colors (${paletteColors.length})`}
                  </button>
                )}
              </div>

              {activeColor?.isNonReturnable && (
                <p
                  style={{
                    fontSize: '12px',
                    color: '#b45309',
                    backgroundColor: '#fef3c7',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontWeight: 500,
                  }}
                >
                  {lang === 'ua'
                    ? 'Обраний колір виготовляється під замовлення — без обміну та повернення.'
                    : 'This color is made to order — non-returnable and non-exchangeable.'}
                </p>
              )}
            </div>

            {/* Розмір */}
            <div className="product-page__section">
              <div className="product-page__label">
                <span>{lang === 'ua' ? 'Розмір' : 'Size'}</span>
                {selectedSize && (
                  <span className="product-page__label-value">{selectedSize} EU</span>
                )}
              </div>

              <div className="product-page__sizes">
                {product.sizes.map((size) => {
                  const isBlocked =
                    blockedSizes.includes(size) || soleBlockedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={isBlocked}
                      onClick={() => {
                        setSelectedSize(size);
                        setErrorMsg('');
                      }}
                      className={`product-page__size-btn ${
                        selectedSize === size ? 'is-selected' : ''
                      } ${isBlocked ? 'is-blocked' : ''}`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMsg && <p className="product-page__error">{errorMsg}</p>}

            <div className="product-page__actions">
              <button
                type="button"
                className="product-page__buy-btn"
                onClick={handleAddToCart}
              >
                {addedToast
                  ? lang === 'ua'
                    ? '✓ Додано в кошик'
                    : '✓ Added to cart'
                  : lang === 'ua'
                  ? 'Додати в кошик'
                  : 'Add to cart'}
              </button>

              <Link to="/constructor" className="product-page__custom-link">
                {lang === 'ua'
                  ? 'Зібрати інший колір у Конструкторі'
                  : 'Customize in Constructor'}
              </Link>
            </div>

            {isAdmin && (
              <div className="product-page__admin-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                    Налаштування пари (Адмін)
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleInStock(product.id)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: product.inStock ? '#8cbff0' : '#e2e8f0',
                      color: product.inStock ? '#1e3a5f' : '#475569',
                    }}
                  >
                    {product.inStock ? '✓ Є в наявності' : 'Немає в наявності'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                      Виробник:
                    </label>
                    <select
                      value={mfr.id}
                      onChange={(e) => handleChangeProductManufacturer(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 8px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#fff',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {Object.values(manufacturers).map((itemMfr) => (
                        <option key={itemMfr.id} value={itemMfr.id}>
                          {itemMfr.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                      Підошва (розміри):
                    </label>
                    <select
                      value={activeSole?.id || ''}
                      onChange={(e) => handleChangeProductSole(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 8px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#fff',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {(mfr.soles || []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Доступні утеплювачі для пари */}
                <div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                    Доступні утеплювачі для цієї пари:
                  </p>
                  <div className="product-page__admin-chips">
                    <button
                      type="button"
                      onClick={() => toggleLiningAvailability('fleece')}
                      className={`product-page__admin-chip ${
                        !availableLinings.includes('fleece') ? 'is-blocked' : ''
                      }`}
                    >
                      Байка
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLiningAvailability('fur')}
                      className={`product-page__admin-chip ${
                        !availableLinings.includes('fur') ? 'is-blocked' : ''
                      }`}
                    >
                      Хутро
                    </button>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                    Стоп на розміри для цієї пари:
                  </p>
                  <div className="product-page__admin-chips">
                    {product.sizes.map((size) => {
                      const isBlocked =
                        blockedSizes.includes(size) || soleBlockedSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleBlockSize(product.id, size)}
                          className={`product-page__admin-chip ${isBlocked ? 'is-blocked' : ''}`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                    Стоп на кольори ({selectedMaterial === 'leather' ? 'Шкіра' : 'Замша'}) для цієї пари:
                  </p>
                  <div className="product-page__admin-chips">
                    {paletteColors.map((c) => {
                      const isBlocked = c.isBlocked || blockedColorIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleProductColorBlock(product.id, c.id)}
                          className={`product-page__admin-chip ${isBlocked ? 'is-blocked' : ''}`}
                        >
                          {c.name.ua}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}