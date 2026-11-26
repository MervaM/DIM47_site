export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Не задано GEMINI_API_KEY у налаштуваннях середовища Vercel.',
    });
  }

  try {
    const {
      modelImage,
      soleImage,
      soleColor,
      material,
      primaryColor,
      secondaryColor,
      fur,
      prompt: customPrompt,
    } = req.body || {};

    if (!modelImage && !customPrompt) {
      return res.status(400).json({
        error: 'Потрібне фото моделі або текстовий опис конфігурації.',
      });
    }

    const parseImagePart = (input) => {
      if (!input || typeof input !== 'string') return null;
      const match = input.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) return null;
      return {
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      };
    };

    const materialDesc =
      material === 'suede'
        ? 'genuine matte velvety suede (замша)'
        : 'genuine smooth natural leather (натуральна шкіра)';

    const furMap = {
      none: 'unlined smooth leather interior, no fur',
      fleece: 'thin warm fleece lining inside',
      fur: 'soft fur lining visible slightly at the inner collar/edge',
      teddy: 'cozy curly teddy wool lining inside',
    };

    const parts = [];

    const modelPart = parseImagePart(modelImage);
    if (modelPart) {
      parts.push({
        text: 'REFERENCE IMAGE 1 (SHOE UPPER SILHOUETTE & CUT): Keep the exact upper pattern, stitching lines, lacing/elastic/straps, and anatomical toe box shape from this footwear model.',
      });
      parts.push(modelPart);
    }

    const solePart = parseImagePart(soleImage);
    if (solePart) {
      parts.push({
        text: 'REFERENCE IMAGE 2 (OUTSOLE SHAPE & TREAD): Take the sole profile, thickness, welt, and tread pattern from the sole shown in this image.',
      });
      parts.push(solePart);
    }

    const instruction = [
      'Generate a clean, photorealistic e-commerce studio product photograph of a pair of custom-made shoes on a pure light neutral background (#f8fafc), three-quarter side view, soft studio shadows.',
      modelPart
        ? 'Combine the upper design from REFERENCE IMAGE 1 with the sole shape from REFERENCE IMAGE 2.'
        : customPrompt,
      `Upper material: ${materialDesc}.`,
      primaryColor ? `Primary upper color: "${primaryColor}".` : '',
      secondaryColor
        ? `Two-tone color combination: apply "${primaryColor}" to the main vamp/body and "${secondaryColor}" to the accent panels (heel counter, tongue, or trim).`
        : 'Single-color upper.',
      soleColor ? `Outsole color: "${soleColor}".` : '',
      `Interior lining: ${furMap[fur] || furMap.none}.`,
      'No text, no watermarks, no mannequin legs, crisp footwear photography.',
    ]
      .filter(Boolean)
      .join(' ');

    parts.push({ text: instruction });

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            responseModalities: ['IMAGE'],
          },
        }),
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status).json({
        error: data?.error?.message || 'Помилка Gemini API при генерації фото.',
      });
    }

    const responseParts = data?.candidates?.[0]?.content?.parts || [];
    const generatedImage = responseParts.find((p) => p.inlineData?.data);

    if (!generatedImage) {
      return res.status(502).json({
        error: 'Модель не повернула зображення. Спробуйте іншу комбінацію.',
      });
    }

    const mimeType = generatedImage.inlineData.mimeType || 'image/png';
    const imageUrl = `data:${mimeType};base64,${generatedImage.inlineData.data}`;

    return res.status(200).json({ imageUrl });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || 'Внутрішня помилка сервера під час генерації.',
    });
  }
}