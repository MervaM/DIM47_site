import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { useCart } from '../../context/CartContext';
import './Product.scss';

const MATERIAL_LABELS = {
  leather: { ua: 'Шкіра', en: 'Leather' },
  suede: { ua: 'Замша', en: 'Suede' },
};

const LINING_LABELS = {
  fleece: { ua: 'Байка', en: 'Fleece' },
  fur: { ua: 'Хутро', en: 'Fur' },
};

const compressImageFile = (file, maxWidth = 800, quality = 0.82) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
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
  const { addToCart } = useCart();

  const product = items.find((item) => item.id === id);

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [colorPreviewPhoto, setColorPreviewPhoto] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('leather');
  const [selectedLining, setSelectedLining] = useState('fleece'); // 'fleece' = байка, 'fur' = хутро
  const [showMoreColors, setShowMoreColors] = useState(false);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [addedToast, setAddedToast] = useState(false);
  const [isColorPhotosOpen, setIsColorPhotosOpen] = useState(false);

  const mfr = manufacturers[product?.manufacturerId] || manufacturers.m1;
  const activeSole = mfr?.soles?.find((s) => s.id === product?.soleId) || mfr?.soles?.[0];
  const soleBlockedSizes = activeSole?.blockedSizes || [];

  const availableMaterials = product?.availableMaterials || ['leather', 'suede'];
  const availableLinings = product?.availableLinings || ['fleece', 'fur'];

  const paletteColors = mfr?.palettes?.[selectedMaterial] || [];
  const standardColors = paletteColors.filter((c) => !c.isNonReturnable);
  const extraNonReturnableColors = paletteColors.filter((c) => c.isNonReturnable);

  const blockedSizes = product?.blockedSizes || [];
  const blockedColorIds = product?.blockedColorIds || [];
  const colorPhotosMap = product?.colorPhotos || {};

  const gallery = product?.gallery?.length
    ? product.gallery
    : product?.image
    ? [product.image]
    : [];

  useEffect(() => {
    if (!product) return;
    setActivePhotoIdx(0);
    setColorPreviewPhoto('');
    setShowMoreColors(false);
    const firstMat = availableMaterials[0] || 'leather';
    setSelectedMaterial(firstMat);
    const firstLin = availableLinings[0] || 'fleece';
    setSelectedLining(firstLin);
  }, [product?.id]);

  useEffect(() => {
    setShowMoreColors(false);
    setColorPreviewPhoto('');
    const firstValidColor = paletteColors.find(
      (c) => !c.isBlocked && !blockedColorIds.includes(c.id)
    );
    const nextId = firstValidColor ? firstValidColor.id : null;
    setSelectedColorId(nextId);
    if (nextId && colorPhotosMap[nextId]) {
      setColorPreviewPhoto(colorPhotosMap[nextId]);
    }
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
  const mainDisplayPhoto =
    colorPreviewPhoto || gallery[activePhotoIdx] || product.image;

  const handleSelectColor = (color) => {
    if (color.isNonReturnable) {
      setShowMoreColors(true);
    }
    setSelectedColorId(color.id);
    setErrorMsg('');

    const mappedPhoto = colorPhotosMap[color.id];
    setColorPreviewPhoto(mappedPhoto || '');
  };

  const handleAssignColorPhoto = async (colorId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      const nextMap = {
        ...colorPhotosMap,
        [colorId]: compressed,
      };
      updateProduct(product.id, { colorPhotos: nextMap });
      if (selectedColorId === colorId) {
        setColorPreviewPhoto(compressed);
      }
    } catch {
      alert('Не вдалося привʼязати фото до кольору.');
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveColorPhoto = (colorId) => {
    const nextMap = { ...colorPhotosMap };
    delete nextMap[colorId];
    updateProduct(product.id, { colorPhotos: nextMap });
    if (selectedColorId === colorId) {
      setColorPreviewPhoto('');
    }
  };

  const renderColorSwatch = (color) => {
    const isColorBlocked = color.isBlocked || blockedColorIds.includes(color.id);
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
          style={{
            backgroundColor: color.hex || '#e2e8f0',
            backgroundImage: color.imageUrl ? `url(${color.imageUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </button>
    );
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
    setColorPreviewPhoto('');
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
    if (!selectedColorId || !activeColor) {
      setErrorMsg(lang === 'ua' ? 'Оберіть доступний колір' : 'Select an available color');
      return;
    }
    if (!selectedSize) {
      setErrorMsg(lang === 'ua' ? 'Будь ласка, оберіть розмір' : 'Please select a size');
      return;
    }

    const cartItemPayload = {
      cartItemKey: `${product.id}__${selectedMaterial}__${selectedLining}__${activeColor.id}__${selectedSize}`,
      productId: product.id,
      manufacturerId: mfr.id,
      manufacturerName: mfr.name,
      title: product.title,
      price: product.price,
      image: mainDisplayPhoto,
      colorSwatchUrl: activeColor.imageUrl || '',
      material: selectedMaterial,
      materialLabel: MATERIAL_LABELS[selectedMaterial] || { ua: selectedMaterial, en: selectedMaterial },
      lining: selectedLining,
      liningLabel: LINING_LABELS[selectedLining] || { ua: selectedLining, en: selectedLining },
      colorId: activeColor.id,
      colorName: activeColor.name,
      isNonReturnable: Boolean(activeColor.isNonReturnable),
      size: selectedSize,
      quantity: 1,
    };

    addToCart(cartItemPayload);

    setErrorMsg('');
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const attachedCountInPalette = paletteColors.filter((c) => colorPhotosMap[c.id]).length;

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
                src={mainDisplayPhoto}
                alt={product.title[lang]}
                className="product-page__img"
              />
            </div>

            <div className="product-page__thumbs">
              {gallery.map((photoUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setColorPreviewPhoto('');
                    setActivePhotoIdx(idx);
                  }}
                  className={`product-page__thumb ${
                    !colorPreviewPhoto && activePhotoIdx === idx ? 'is-active' : ''
                  }`}
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

            {/* Кольори: звичайні одразу + "Більше кольорів" для позицій без обміну і повернення */}
            <div className="product-page__section">
              <div className="product-page__label">
                <span>{lang === 'ua' ? 'Колір' : 'Color'}</span>
                <span className="product-page__label-value">
                  {activeColor?.name?.[lang] || ''}
                </span>
              </div>

              <div className="product-page__colors" style={{ alignItems: 'center' }}>
                {standardColors.map(renderColorSwatch)}

                {extraNonReturnableColors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowMoreColors((prev) => !prev)}
                    className={`product-page__more-colors-btn ${
                      showMoreColors ? 'is-open' : ''
                    }`}
                  >
                    {showMoreColors
                      ? lang === 'ua'
                        ? 'Згорнути'
                        : 'Hide'
                      : lang === 'ua'
                      ? 'Більше кольорів'
                      : 'More colors'}
                  </button>
                )}
              </div>

              {showMoreColors && extraNonReturnableColors.length > 0 && (
                <div className="product-page__extra-colors">
                  <span className="product-page__extra-colors-title">
                    {lang === 'ua'
                      ? 'Без обміну і повернення'
                      : 'Non-returnable & non-exchangeable'}
                  </span>
                  <div className="product-page__colors">
                    {extraNonReturnableColors.map(renderColorSwatch)}
                  </div>
                </div>
              )}

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

                {/* Прихована "папка" фото пари під кожен колір */}
                <div
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    backgroundColor: '#fff',
                    padding: '10px 12px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsColorPhotosOpen((prev) => !prev)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#1e293b',
                      cursor: 'pointer',
                    }}
                  >
                    <span>
                      📁 Фото пари по кольорах ({selectedMaterial === 'leather' ? 'Шкіра' : 'Замша'}) — привʼязано: {attachedCountInPalette}/{paletteColors.length}
                    </span>
                    <span style={{ fontSize: '11px', color: '#2b4c6f' }}>
                      {isColorPhotosOpen ? 'Сховати ▲' : 'Відкрити ▼'}
                    </span>
                  </button>

                  {isColorPhotosOpen && (
                    <div
                      style={{
                        marginTop: '10px',
                        paddingTop: '10px',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {paletteColors.map((c) => {
                        const attachedPhoto = colorPhotosMap[c.id];
                        return (
                          <div
                            key={c.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                              <span
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  backgroundColor: '#e2e8f0',
                                  backgroundImage: attachedPhoto
                                    ? `url(${attachedPhoto})`
                                    : c.imageUrl
                                    ? `url(${c.imageUrl})`
                                    : 'none',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  border: '1px solid #cbd5e1',
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#334155',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {c.name.ua}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              <label
                                style={{
                                  padding: '4px 9px',
                                  borderRadius: '6px',
                                  border: '1px dashed #8cbff0',
                                  backgroundColor: '#eef6ff',
                                  color: '#1e3a5f',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                {attachedPhoto ? 'Замінити фото' : '+ Фото пари'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleAssignColorPhoto(c.id, e)}
                                  style={{ display: 'none' }}
                                />
                              </label>

                              {attachedPhoto && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColorPhoto(c.id)}
                                  style={{
                                    padding: '4px 7px',
                                    borderRadius: '6px',
                                    backgroundColor: '#fee2e2',
                                    color: '#b91c1c',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                  }}
                                  title="Прибрати фото для цього кольору"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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