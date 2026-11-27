import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import './Home.scss';

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.62;

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.startsWith('data:')) {
        resolve(reader.result);
      } else {
        reject(new Error('INVALID_DATA_URL'));
      }
    };
    reader.onerror = () => reject(new Error('FILE_READ_ERROR'));
    reader.onabort = () => reject(new Error('FILE_READ_ABORTED'));
    reader.readAsDataURL(file);
  });

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) {
        reject(new Error('EMPTY_IMAGE_DIMENSIONS'));
        return;
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error('IMAGE_DECODE_ERROR'));
    img.src = src;
  });

const compressHeroImage = async (file) => {
  if (!file) {
    throw new Error('NO_FILE');
  }

  const lowerName = (file.name || '').toLowerCase();
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    lowerName.endsWith('.heic') ||
    lowerName.endsWith('.heif');

  if (isHeic) {
    throw new Error('UNSUPPORTED_HEIC');
  }

  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('NOT_AN_IMAGE');
  }

  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImageElement(dataUrl);

  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const maxSide = Math.max(width, height);
  const scale = maxSide > MAX_DIMENSION ? MAX_DIMENSION / maxSide : 1;

  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('CANVAS_CONTEXT_ERROR');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
};

export default function Home() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const adminContext = useAdmin();
  const {
    isAdmin,
    heroData,
    addHeroSlides,
    updateHeroSlides,
    setHeroSlides,
    removeHeroSlide,
    updateHeroTexts,
  } = adminContext;

  const slides = heroData?.slides?.length ? heroData.slides : [];
  const [activeIdx, setActiveIdx] = useState(0);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const didSwipe = useRef(false);

  const [titleUa, setTitleUa] = useState(heroData?.title?.ua || 'Головна сторінка');
  const [titleEn, setTitleEn] = useState(heroData?.title?.en || 'Home');
  const [subtitleUa, setSubtitleUa] = useState(
    heroData?.subtitle?.ua || 'Анатомічне взуття з натуральних матеріалів.'
  );
  const [subtitleEn, setSubtitleEn] = useState(
    heroData?.subtitle?.en || 'Anatomical footwear crafted from natural materials.'
  );

  useEffect(() => {
    if (activeIdx >= slides.length) {
      setActiveIdx(0);
    }
  }, [slides.length, activeIdx]);

  useEffect(() => {
    if (slides.length <= 1 || isAdminModalOpen || isTouching || isUploading) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, 8500);
    return () => clearInterval(timer);
  }, [slides.length, isAdminModalOpen, isTouching, isUploading]);

  const prevSlide = (e) => {
    if (e) e.stopPropagation();
    if (!slides.length) return;
    setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = (e) => {
    if (e) e.stopPropagation();
    if (!slides.length) return;
    setActiveIdx((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e) => {
    setIsTouching(true);
    didSwipe.current = false;
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
    if (Math.abs(touchStartX.current - touchEndX.current) > 12) {
      didSwipe.current = true;
    }
  };

  const handleTouchEnd = () => {
    setIsTouching(false);
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (Math.abs(diff) >= minSwipeDistance && slides.length > 1) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  const handleBannerClick = () => {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    navigate('/catalog');
  };

  const openModal = (e) => {
    e.stopPropagation();
    setUploadError('');
    setTitleUa(heroData?.title?.ua || '');
    setTitleEn(heroData?.title?.en || '');
    setSubtitleUa(heroData?.subtitle?.ua || '');
    setSubtitleEn(heroData?.subtitle?.en || '');
    setIsAdminModalOpen(true);
  };

  const appendSlidesToContext = (newSlides) => {
    if (typeof addHeroSlides === 'function') {
      addHeroSlides(newSlides);
      return true;
    }
    if (typeof updateHeroSlides === 'function') {
      updateHeroSlides([...slides, ...newSlides]);
      return true;
    }
    if (typeof setHeroSlides === 'function') {
      setHeroSlides([...slides, ...newSlides]);
      return true;
    }
    return false;
  };

  const handleUploadSlides = async (e) => {
    const inputEl = e.target;
    const files = Array.from(inputEl.files || []);
    inputEl.value = '';

    if (!files.length) return;

    setUploadError('');
    setIsUploading(true);

    try {
      const results = await Promise.allSettled(files.map((file) => compressHeroImage(file)));
      const succeeded = results
        .filter((res) => res.status === 'fulfilled')
        .map((res) => res.value);
      const failed = results.filter((res) => res.status === 'rejected');

      if (succeeded.length > 0) {
        const saved = appendSlidesToContext(succeeded);
        if (!saved) {
          setUploadError(
            'У AdminContext відсутня функція додавання слайдів (наприклад, addHeroSlides).'
          );
        } else {
          setActiveIdx(slides.length);
          try {
            const testPayload = JSON.stringify({
              ...heroData,
              slides: [...slides, ...succeeded],
            });
            if (testPayload.length > 4_500_000) {
              setUploadError(
                'Фото додано в поточну сесію, але перевищено ліміт памʼяті браузера (localStorage). Видаліть зайві слайди або використайте хмарне сховище.'
              );
            }
          } catch {
            // ігноруємо
          }
        }
      }

      if (failed.length > 0) {
        const hasHeic = failed.some((item) => item.reason?.message === 'UNSUPPORTED_HEIC');
        if (hasHeic) {
          setUploadError(
            'Формат HEIC/HEIF з телефона не підтримується напряму в браузері. Збережіть фото як JPG/JPEG або увімкніть «Найбільш сумісний» у налаштуваннях камери.'
          );
        } else if (succeeded.length === 0) {
          setUploadError(
            'Не вдалося обробити фото. Перевірте файл або спробуйте інше зображення (JPG, PNG, WebP).'
          );
        } else {
          setUploadError(
            `Додано ${succeeded.length} із ${files.length} фото. Деякі файли не вдалося обробити.`
          );
        }
      }
    } catch (err) {
      setUploadError(err?.message || 'Сталася помилка під час завантаження фото.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveTexts = (e) => {
    e.preventDefault();
    if (typeof updateHeroTexts === 'function') {
      updateHeroTexts({
        title: { ua: titleUa, en: titleEn || titleUa },
        subtitle: { ua: subtitleUa, en: subtitleEn || subtitleUa },
      });
    }
    setIsAdminModalOpen(false);
  };

  return (
    <section className="hero">
      <div
        className="hero__media"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isAdmin && (
          <button
            type="button"
            onClick={openModal}
            className="hero__admin-trigger"
          >
            ✎ Карусель фото ({slides.length})
          </button>
        )}

        <div
          className="hero__slides"
          onClick={handleBannerClick}
          title={lang === 'ua' ? 'Перейти в каталог' : 'Go to catalog'}
        >
          {slides.map((src, idx) => (
            <div
              key={idx}
              className={`hero__slide ${idx === activeIdx ? 'is-active' : ''}`}
            >
              <img
                src={src}
                alt=""
                aria-hidden="true"
                className="hero__slide__bg"
              />
              <img
                src={src}
                alt={`DiM47 slide ${idx + 1}`}
                className="hero__slide__img"
              />
            </div>
          ))}
          <div className="hero__overlay" />
        </div>

        <div className="hero__content">
          <h1 className="hero__title">{heroData?.title?.[lang] || ''}</h1>
          <p className="hero__subtitle">{heroData?.subtitle?.[lang] || ''}</p>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous slide"
              className="hero__arrow hero__arrow--prev"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next slide"
              className="hero__arrow hero__arrow--next"
            >
              ›
            </button>
          </>
        )}

        {slides.length > 1 && (
          <div className="hero__dots" onClick={(e) => e.stopPropagation()}>
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                onClick={() => setActiveIdx(idx)}
                className={`hero__dot ${idx === activeIdx ? 'is-active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="hero__mobile-actions">
        <Link to="/catalog" className="hero__btn hero__btn--primary">
          {t?.catalog || (lang === 'ua' ? 'Каталог' : 'Catalog')}
        </Link>
        <Link to="/catalog?inStock=true" className="hero__btn hero__btn--secondary">
          {t?.inStock || (lang === 'ua' ? 'Наявність' : 'In Stock')}
        </Link>
        <Link to="/constructor" className="hero__btn hero__btn--secondary">
          {t?.constructor || (lang === 'ua' ? 'Конструктор' : 'Constructor')}
        </Link>
      </div>

      {isAdmin && isAdminModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setIsAdminModalOpen(false)}
        >
          <form
            onSubmit={handleSaveTexts}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              color: '#1e293b',
              borderRadius: '16px',
              padding: '20px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90svh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Карусель Головної сторінки</h2>
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(false)}
                style={{ fontSize: '22px', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: '#475569',
                }}
              >
                Фото у каруселі:
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {slides.map((imgSrc, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveIdx(idx)}
                    style={{
                      position: 'relative',
                      width: '84px',
                      height: '64px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: idx === activeIdx ? '2px solid #8cbff0' : '1px solid #cbd5e1',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={imgSrc}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {slides.length > 1 && typeof removeHeroSlide === 'function' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHeroSlide(idx);
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
                        title="Видалити слайд"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <label
              style={{
                border: '1.5px dashed #8cbff0',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center',
                cursor: isUploading ? 'wait' : 'pointer',
                backgroundColor: '#f8fafc',
                fontSize: '13px',
                fontWeight: 600,
                color: '#2b4c6f',
                opacity: isUploading ? 0.7 : 1,
              }}
            >
              {isUploading
                ? 'Обробка та завантаження фото...'
                : '+ Завантажити фото з компʼютера або телефона (можна кілька)'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                multiple
                disabled={isUploading}
                onChange={handleUploadSlides}
                style={{ display: 'none' }}
              />
            </label>

            {uploadError && (
              <div
                role="alert"
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '12px',
                  lineHeight: 1.45,
                }}
              >
                {uploadError}
              </div>
            )}

            <input
              placeholder="Заголовок (укр)"
              value={titleUa}
              onChange={(e) => setTitleUa(e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <input
              placeholder="Title (en)"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <textarea
              rows={2}
              placeholder="Підзаголовок (укр)"
              value={subtitleUa}
              onChange={(e) => setSubtitleUa(e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
                resize: 'vertical',
              }}
            />
            <textarea
              rows={2}
              placeholder="Subtitle (en)"
              value={subtitleEn}
              onChange={(e) => setSubtitleEn(e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
                resize: 'vertical',
              }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                Закрити
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#8cbff0',
                  color: '#142233',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                Зберегти тексти
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}