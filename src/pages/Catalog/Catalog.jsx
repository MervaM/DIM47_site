import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { CATEGORIES } from '../../data/products';
import { uploadVaultImage } from '../../lib/supabase';
import ProductCard, {
  LAST_PRODUCT_ID_KEY,
  CATALOG_SCROLL_KEY,
} from '../../components/ProductCard/ProductCard';
import './Catalog.scss';

const buildMaterialLabel = (materials = []) => {
  const hasLeather = materials.includes('leather');
  const hasSuede = materials.includes('suede');

  if (hasLeather && hasSuede) {
    return {
      ua: 'Шкіра / замша',
      en: 'Leather / suede',
    };
  }
  if (hasLeather) {
    return {
      ua: 'Шкіра',
      en: 'Leather',
    };
  }
  if (hasSuede) {
    return {
      ua: 'Замша',
      en: 'Suede',
    };
  }
  return {
    ua: '',
    en: '',
  };
};

export default function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, gender, toggleGender } = useLanguage();
  const { isAdmin, items, manufacturers, addProduct, updateProduct } = useAdmin();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    manufacturerId: 'm1',
    soleId: 'sole_m1_1',
    titleUa: '',
    titleEn: '',
    materialUa: '',
    materialEn: '',
    category: 'boots',
    gender: 'women',
    price: '',
    gallery: [],
    sizes: '36, 37, 38, 39, 40, 41',
    availableMaterials: ['leather', 'suede'],
  });

  const onlyInStock = searchParams.get('inStock') === 'true';

  const filteredProducts = useMemo(() => {
    return items.filter((item) => {
      if (!isAdmin && item.isBlocked) return false;
      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchGender =
        gender === 'all' || item.gender === gender || item.gender === 'unisex';
      const matchStock = !onlyInStock || item.inStock;
      return matchCategory && matchGender && matchStock;
    });
  }, [items, isAdmin, selectedCategory, gender, onlyInStock]);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const saveScrollPosition = () => {
      try {
        sessionStorage.setItem(CATALOG_SCROLL_KEY, String(window.scrollY || 0));
      } catch {
        // ігноруємо помилки доступу до sessionStorage
      }
    };

    window.addEventListener('scroll', saveScrollPosition, { passive: true });
    return () => {
      saveScrollPosition();
      window.removeEventListener('scroll', saveScrollPosition);
    };
  }, []);

  useEffect(() => {
    if (!filteredProducts.length) return;

    let targetProductId = '';
    let savedY = 0;

    try {
      targetProductId = sessionStorage.getItem(LAST_PRODUCT_ID_KEY) || '';
      const rawY = sessionStorage.getItem(CATALOG_SCROLL_KEY);
      savedY = rawY ? Number(rawY) : 0;
    } catch {
      targetProductId = '';
      savedY = 0;
    }

    const restorePosition = () => {
      if (targetProductId) {
        const cardEl = document.querySelector(
          `[data-product-id="${CSS.escape(targetProductId)}"]`
        );
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'auto', block: 'center' });
          return;
        }
      }

      if (savedY && !Number.isNaN(savedY) && savedY > 0) {
        window.scrollTo({ top: savedY, left: 0, behavior: 'auto' });
      }
    };

    const raf1 = requestAnimationFrame(() => {
      restorePosition();
      requestAnimationFrame(restorePosition);
    });

    const timerId = window.setTimeout(restorePosition, 120);

    return () => {
      cancelAnimationFrame(raf1);
      window.clearTimeout(timerId);
    };
  }, [filteredProducts.length, selectedCategory, gender, onlyInStock]);

  const handleReset = () => {
    setSelectedCategory('all');
    if (gender !== 'all') toggleGender(gender);
    if (onlyInStock) setSearchParams({});
  };

  const openAddModal = () => {
    const defaultMfr = manufacturers.m1;
    const firstSole = defaultMfr?.soles?.[0];
    setEditingProduct(null);
    setForm({
      manufacturerId: 'm1',
      soleId: firstSole?.id || '',
      titleUa: '',
      titleEn: '',
      materialUa: '',
      materialEn: '',
      category: selectedCategory === 'all' ? 'boots' : selectedCategory,
      gender: gender === 'all' ? 'women' : gender,
      price: '3800',
      gallery: [],
      sizes: (firstSole?.sizes || [36, 37, 38, 39, 40]).join(', '),
      availableMaterials: ['leather', 'suede'],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    const mfr = manufacturers[product.manufacturerId] || manufacturers.m1;
    const activeSole =
      mfr?.soles?.find((s) => s.id === product.soleId) || mfr?.soles?.[0];
    const mats = product.availableMaterials || ['leather', 'suede'];

    setEditingProduct(product);
    setForm({
      manufacturerId: mfr.id,
      soleId: activeSole?.id || '',
      titleUa: product.title?.ua || '',
      titleEn: product.title?.en || '',
      materialUa: product.material?.ua ?? '',
      materialEn: product.material?.en ?? '',
      category: product.category,
      gender: product.gender || 'unisex',
      price: String(product.price),
      gallery: product.gallery?.length ? product.gallery : [product.image],
      sizes: product.sizes.join(', '),
      availableMaterials: mats,
    });
    setIsModalOpen(true);
  };

  const handleManufacturerChange = (newMfrId) => {
    const mfr = manufacturers[newMfrId];
    const firstSole = mfr?.soles?.[0];
    setForm((prev) => ({
      ...prev,
      manufacturerId: newMfrId,
      soleId: firstSole?.id || '',
      sizes: firstSole ? firstSole.sizes.join(', ') : prev.sizes,
    }));
  };

  const handleSoleChange = (newSoleId) => {
    const mfr = manufacturers[form.manufacturerId];
    const sole = mfr?.soles?.find((s) => s.id === newSoleId);
    setForm((prev) => ({
      ...prev,
      soleId: newSoleId,
      sizes: sole ? sole.sizes.join(', ') : prev.sizes,
    }));
  };

  const handleFilesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploadingPhotos(true);
    try {
      const uploadedUrls = await Promise.all(
        files.map((f) => uploadVaultImage(f, 'catalog', 900))
      );
      setForm((prev) => ({
        ...prev,
        gallery: [...prev.gallery, ...uploadedUrls],
      }));
    } catch {
      alert('Не вдалося завантажити фото.');
    } finally {
      setIsUploadingPhotos(false);
      e.target.value = '';
    }
  };

  const removeGalleryPhoto = (idxToRemove) => {
    setForm((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, idx) => idx !== idxToRemove),
    }));
  };

  const toggleMaterialOption = (mat) => {
    setForm((prev) => {
      const exists = prev.availableMaterials.includes(mat);
      if (exists && prev.availableMaterials.length === 1) return prev;
      const nextMaterials = exists
        ? prev.availableMaterials.filter((m) => m !== mat)
        : [...prev.availableMaterials, mat];
      return {
        ...prev,
        availableMaterials: nextMaterials,
      };
    });
  };

  const applyAutoMaterialText = () => {
    const generated = buildMaterialLabel(form.availableMaterials);
    setForm((prev) => ({
      ...prev,
      materialUa: generated.ua,
      materialEn: generated.en,
    }));
  };

  const clearMaterialText = () => {
    setForm((prev) => ({
      ...prev,
      materialUa: '',
      materialEn: '',
    }));
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!form.gallery.length) {
      alert('Оберіть хоча б одне фото з папки на компʼютері');
      return;
    }

    const parsedSizes = form.sizes
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0);

    const cleanMaterialUa = form.materialUa.trim();
    const cleanMaterialEn = form.materialEn.trim() || cleanMaterialUa;

    const payload = {
      manufacturerId: form.manufacturerId,
      soleId: form.soleId,
      title: { ua: form.titleUa, en: form.titleEn || form.titleUa },
      material: { ua: cleanMaterialUa, en: cleanMaterialEn },
      category: form.category,
      gender: form.gender,
      price: Number(form.price) || 0,
      image: form.gallery[0],
      gallery: form.gallery,
      sizes: parsedSizes.length ? parsedSizes : [36, 37, 38, 39, 40],
      availableMaterials: form.availableMaterials,
      inStock: editingProduct ? editingProduct.inStock : false,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }
    setIsModalOpen(false);
  };

  const selectedMfrObj = manufacturers[form.manufacturerId] || manufacturers.m1;

  return (
    <section className="catalog">
      <div className="container">
        <div className="catalog__header">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h1 className="catalog__title">
              {onlyInStock ? t.inStock : t.catalog}
            </h1>
            <span className="catalog__count">{filteredProducts.length}</span>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={openAddModal}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                backgroundColor: '#8cbff0',
                color: '#fbf3d1',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              + Додати пару
            </button>
          )}
        </div>

        <div className="catalog__filters" role="tablist">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat.id}
              className={`catalog__chip ${
                selectedCategory === cat.id ? 'is-active' : ''
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {t[cat.labelKey]}
            </button>
          ))}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="catalog__grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={openEditModal}
              />
            ))}
          </div>
        ) : (
          <div className="catalog__empty">
            <p>{t.emptyCatalog}</p>
            <button
              type="button"
              className="catalog__reset-btn"
              onClick={handleReset}
            >
              {t.resetFilters}
            </button>
          </div>
        )}
      </div>

      {isAdmin && isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <form
            onSubmit={handleSaveProduct}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '14px',
              padding: '20px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90svh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h2 style={{ fontSize: '20px' }}>
              {editingProduct ? 'Редагувати пару' : 'Нова пара взуття'}
            </h2>

            <div
              style={{
                backgroundColor: '#f1f5f9',
                padding: '10px',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '4px',
                    color: '#1e293b',
                  }}
                >
                  1. Виробник (підтягує палітру матеріалів):
                </label>
                <select
                  value={form.manufacturerId}
                  onChange={(e) => handleManufacturerChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    fontWeight: 600,
                  }}
                >
                  {Object.values(manufacturers).map((mfr) => (
                    <option key={mfr.id} value={mfr.id}>
                      {mfr.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '4px',
                    color: '#1e293b',
                  }}
                >
                  2. Підошва (підтягує розмірну сітку):
                </label>
                <select
                  value={form.soleId}
                  onChange={(e) => handleSoleChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    fontWeight: 600,
                  }}
                >
                  {(selectedMfrObj?.soles || []).map((sole) => (
                    <option key={sole.id} value={sole.id}>
                      {sole.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              {form.gallery.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginBottom: '8px',
                  }}
                >
                  {form.gallery.map((imgSrc, idx) => (
                    <div
                      key={idx}
                      style={{ position: 'relative', width: '68px', height: '68px' }}
                    >
                      <img
                        src={imgSrc}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border:
                            idx === 0 ? '2px solid #8cbff0' : '1px solid #ddd',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryPhoto(idx)}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label
                style={{
                  border: '1.5px dashed #8cbff0',
                  borderRadius: '10px',
                  padding: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#f8fafc',
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#2b4c6f',
                }}
              >
                {isUploadingPhotos
                  ? 'Завантаження фото у хмару...'
                  : '+ Додати фото з папки (можна обрати кілька одразу)'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={isUploadingPhotos}
                  onChange={handleFilesChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <input
              required
              placeholder="Назва (укр)"
              value={form.titleUa}
              onChange={(e) => setForm({ ...form, titleUa: e.target.value })}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
            />
            <input
              placeholder="Назва (англ)"
              value={form.titleEn}
              onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
            />

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            >
              {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                <option key={c.id} value={c.id}>
                  {t[c.labelKey]}
                </option>
              ))}
            </select>

            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: '#475569',
                }}
              >
                Для кого модель:
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: 'women', label: '♀ Жінкам' },
                  { id: 'men', label: '♂ Чоловікам' },
                  { id: 'unisex', label: '♀♂ Обом' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setForm({ ...form, gender: opt.id })}
                    style={{
                      flex: 1,
                      padding: '9px 8px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border:
                        form.gender === opt.id
                          ? '1.5px solid #8cbff0'
                          : '1px solid #ddd',
                      backgroundColor: form.gender === opt.id ? '#8cbff0' : '#fff',
                      color: form.gender === opt.id ? '#fbf3d1' : '#334155',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', gap: '14px', fontSize: '13px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      checked={form.availableMaterials.includes('leather')}
                      onChange={() => toggleMaterialOption('leather')}
                    />
                    Шкіра
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      checked={form.availableMaterials.includes('suede')}
                      onChange={() => toggleMaterialOption('suede')}
                    />
                    Замша
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={applyAutoMaterialText}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#fff',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    Підставити з чекбоксів
                  </button>

                  <button
                    type="button"
                    onClick={clearMaterialText}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '6px',
                      border: '1px solid #fecaca',
                      backgroundColor: '#fef2f2',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#b91c1c',
                      cursor: 'pointer',
                    }}
                  >
                    Очистити
                  </button>
                </div>
              </div>

              <input
                placeholder="Рядок матеріалу на картці (укр), напр. Шкіра / замша"
                value={form.materialUa}
                onChange={(e) => setForm({ ...form, materialUa: e.target.value })}
                style={{
                  padding: '9px 10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  fontSize: '13px',
                }}
              />
              <input
                placeholder="Material line on card (en), e.g. Leather / suede"
                value={form.materialEn}
                onChange={(e) => setForm({ ...form, materialEn: e.target.value })}
                style={{
                  padding: '9px 10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>

            <input
              required
              type="number"
              placeholder="Ціна (грн)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
            />
            <input
              placeholder="Розміри (підтягнуто від підошви)"
              value={form.sizes}
              onChange={(e) => setForm({ ...form, sizes: e.target.value })}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                }}
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={isUploadingPhotos}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#8cbff0',
                  color: '#fbf3d1',
                  fontWeight: 600,
                }}
              >
                {isUploadingPhotos ? 'Зачекайте...' : 'Зберегти'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}