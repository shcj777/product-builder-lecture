/**
 * Google Teachable Machine Image Model Integration
 * Model URL: https://teachablemachine.withgoogle.com/models/ngTM3WOYj/
 */

export interface AnimalPredictionResult {
  dogPercent: number;
  catPercent: number;
  dominantAnimal: 'dog' | 'cat';
  rawPredictions: { className: string; probability: number }[];
}

export interface AnimalProfile {
  type: 'dog' | 'cat';
  koreanName: string;
  emoji: string;
  title: string;
  badge: string;
  tagline: string;
  description: string;
  traits: string[];
  celebrityExamples: string[];
  vibe: string;
  matchChemistry: string;
}

export const ANIMAL_PROFILES: Record<'dog' | 'cat', AnimalProfile> = {
  dog: {
    type: 'dog',
    koreanName: '강아지상',
    emoji: '🐶',
    title: '다정하고 사랑스러운 멍뭉미 넘치는 강아지상!',
    badge: '친화력 100% · 순수 매력',
    tagline: '보는 사람마저 무장해제시키는 따뜻하고 맑은 눈망울의 소유자',
    description:
      '첫인상부터 친근하고 다정한 분위기를 풍기며, 주변 사람들을 편안하고 행복하게 만드는 마법 같은 매력을 지니고 있습니다. 솔직하고 충직한 성격과 애교 있는 눈매로 어디서나 큰 사랑을 받는 타입입니다.',
    traits: [
      '동그랗고 맑은 눈망울과 부드러운 인상',
      '공감 능력이 뛰어나고 주변에 친구가 많음',
      '솔직 담백하며 감정 표현에 꾸밈이 없음',
      '미소가 특히 아름답고 긍정적인 에너지를 뿜어냄',
    ],
    celebrityExamples: ['박보검', '송중기', '츄', '박보영', '아이유', '정국'],
    vibe: '따뜻한 봄 햇살, 포근한 니트, 달콤한 바닐라 향',
    matchChemistry: '도도하지만 은근히 챙겨주는 고양이상과 환상의 찰떡궁합!',
  },
  cat: {
    type: 'cat',
    koreanName: '고양이상',
    emoji: '🐱',
    title: '시크하고 치명적인 분위기의 매혹적인 고양이상!',
    badge: '카리스마 100% · 신비로운 매력',
    tagline: '알면 알수록 빠져드는 세련되고 도도한 눈빛의 소유자',
    description:
      '살짝 올라간 매력적인 눈꼬리와 세련된 이목구비로 강렬한 존재감을 자랑합니다. 겉으로는 차가워 보일 수 있지만 내 사람에게는 은근한 다정함(츤데레)을 보여주어 더욱 깊은 매력을 느끼게 만듭니다.',
    traits: [
      '살짝 올라간 매혹적인 눈매와 뚜렷한 턱선',
      '독립적이고 자기 주관이 뚜렷하며 당당함',
      '쉽게 다가가기 힘들지만 친해지면 헤어나올 수 없는 반전 매력',
      '스타일리시하고 독보적인 분위기를 풍김',
    ],
    celebrityExamples: ['제니', '강동원', '노제', '주지훈', '안소희', '원우'],
    vibe: '선선한 가을 밤공기, 시크한 가죽 재킷, 은은한 우디 머스크 향',
    matchChemistry: '언제나 한결같이 꼬리 흔들어주는 다정한 강아지상과 최고의 밸런스!',
  },
};

const MODEL_BASE_URL = 'https://teachablemachine.withgoogle.com/models/ngTM3WOYj/';

interface TMImageModel {
  predict: (image: HTMLImageElement | HTMLCanvasElement) => Promise<{ className: string; probability: number }[]>;
}

interface WindowWithTM extends Window {
  tmImage?: {
    load: (modelURL: string, metadataURL: string) => Promise<TMImageModel>;
  };
}

let loadedModel: TMImageModel | null = null;
let isLoadingModel = false;

/**
 * Load the Teachable Machine model
 */
export async function loadAnimalFaceModel(): Promise<TMImageModel> {
  if (loadedModel) return loadedModel;
  if (isLoadingModel) {
    // Wait for in-flight load
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (loadedModel) return loadedModel;
  }

  isLoadingModel = true;

  try {
    const win = window as unknown as WindowWithTM;
    if (!win.tmImage) {
      // Wait up to 3 seconds for script if still loading
      for (let i = 0; i < 15; i++) {
        if (win.tmImage) break;
        await new Promise((res) => setTimeout(res, 200));
      }
    }

    if (!win.tmImage) {
      throw new Error('Teachable Machine 라이브러리를 로드하지 못했습니다.');
    }

    const modelURL = MODEL_BASE_URL + 'model.json';
    const metadataURL = MODEL_BASE_URL + 'metadata.json';

    loadedModel = await win.tmImage.load(modelURL, metadataURL);
    return loadedModel;
  } finally {
    isLoadingModel = false;
  }
}

/**
 * Predict whether an image is closer to a Dog or a Cat
 */
export async function predictAnimalLikeness(
  imageEl: HTMLImageElement | HTMLCanvasElement
): Promise<AnimalPredictionResult> {
  const model = await loadAnimalFaceModel();
  const predictions = await model.predict(imageEl);

  // In user's model labels: ["Class 1", "Class 2"]
  // Class 1 = 강아지 (Dog), Class 2 = 고양이 (Cat)
  let dogProb = 0.5;
  let catProb = 0.5;

  predictions.forEach((p) => {
    const labelLower = p.className.toLowerCase();
    if (labelLower.includes('class 1') || labelLower.includes('dog') || labelLower.includes('강아지') || labelLower.includes('개')) {
      dogProb = p.probability;
    } else if (labelLower.includes('class 2') || labelLower.includes('cat') || labelLower.includes('고양이')) {
      catProb = p.probability;
    }
  });

  // Ensure normalized 100% total
  const sum = dogProb + catProb;
  const dogPercent = Math.round((dogProb / Math.max(0.0001, sum)) * 100);
  const catPercent = 100 - dogPercent;

  const dominantAnimal = dogPercent >= catPercent ? 'dog' : 'cat';

  return {
    dogPercent,
    catPercent,
    dominantAnimal,
    rawPredictions: predictions,
  };
}
