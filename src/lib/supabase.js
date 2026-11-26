import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://wruysmjhmukwvyeralln.supabase.co';

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const compressImageToDataUrl = (file, maxSize = 420, quality = 0.8) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
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

const dataUrlToBlob = async (dataUrl) => {
  const res = await fetch(dataUrl);
  return res.blob();
};

/**
 * Завантажує фото у Supabase Storage (бакет 'vault-media').
 * Якщо бакет ще не створено або немає мережі — повертає стиснутий DataURL,
 * щоб інтерфейс працював без збоїв.
 */
export const uploadVaultImage = async (file, folder = 'general', maxSize = 420) => {
  const compressedDataUrl = await compressImageToDataUrl(file, maxSize, 0.8);

  if (!supabase) return compressedDataUrl;

  try {
    const blob = await dataUrlToBlob(compressedDataUrl);
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const filePath = `${folder}/${safeName}`;

    const { error } = await supabase.storage
      .from('vault-media')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.warn('Supabase Storage upload fallback to local base64:', error.message);
      return compressedDataUrl;
    }

    const { data } = supabase.storage.from('vault-media').getPublicUrl(filePath);
    return data?.publicUrl || compressedDataUrl;
  } catch (err) {
    console.warn('Upload error fallback:', err);
    return compressedDataUrl;
  }
};