import { GoogleGenAI, Type } from '@google/genai';

// Minimal handler types (avoids @vercel/node dependency)
type Req = { method: string; body: any };
type Res = { status: (c: number) => Res; json: (d: any) => void };

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isCompoundLift = (name: string): boolean => {
  const compounds = [
    'supino', 'agachamento', 'levantamento terra', 'terra', 'remada',
    'desenvolvimento', 'barra fixa', 'paralela', 'leg press', 'stiff',
    'bench press', 'squat', 'deadlift', 'row', 'press', 'pull',
  ];
  return compounds.some(c => name.toLowerCase().includes(c));
};

const formatHistory = (exercise: any): string => {
  if (!exercise.history || exercise.history.length === 0) {
    return '    Sem histórico — primeira vez realizando este exercício.';
  }
  const last5 = [...exercise.history].slice(-5);
  return last5.map((h: any) => {
    const date = new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const rpeStr = h.rpe != null ? `, RPE ${h.rpe}/10` : '';
    return `    - ${date}: ${h.weight}kg × ${h.reps} reps${rpeStr}`;
  }).join('\n');
};

const buildPrompt = (workout: any, userProfile: any): string => {
  const profileSection = userProfile
    ? `PERFIL DO ATLETA:
  - Objetivo: ${userProfile.goal}
  - Nível: ${userProfile.experience_level}
  - Peso corporal: ${userProfile.weight}kg
  - Idade: ${userProfile.age} anos
  - Gênero: ${userProfile.gender}`
    : 'PERFIL DO ATLETA: Não informado — use progressão conservadora.';

  const exerciseDetails = workout.exercises.map((ex: any) => {
    const rpeStr = ex.rpe != null ? `\n      RPE declarado: ${ex.rpe}/10` : '';
    const tipo = isCompoundLift(ex.name) ? 'Composto' : 'Isolado';
    return `
  Exercício: ${ex.name} (ID: ${ex.id}) [${tipo}]
    Alvo: ${ex.sets} séries × ${ex.reps} repetições
    Carga usada hoje: ${ex.currentWeight}kg
    Séries completadas: ${ex.completedSets.length}/${ex.sets}${rpeStr}
    Histórico (últimas sessões):
${formatHistory(ex)}`;
  }).join('\n');

  return `Você é um coach especialista em força e hipertrofia. Analise a sessão abaixo e gere sugestões de carga para o PRÓXIMO treino.

${profileSection}

TREINO DE HOJE: ${workout.name}
${exerciseDetails}

REGRAS DE PROGRESSÃO:
1. Analise a TENDÊNCIA do histórico: o atleta está progredindo, estagnado ou regredindo?
2. Ajuste de carga baseado em performance:
   - Todas as séries completas + RPE ≤ 7 → AUMENTE a carga (recommendation_type: "increase")
   - Todas as séries completas + RPE 8-9 → MANTENHA (recommendation_type: "maintain")
   - Todas as séries completas + sem RPE → aumente moderadamente (recommendation_type: "increase")
   - 1 série perdida → MANTENHA a carga (recommendation_type: "maintain")
   - 2+ séries perdidas ou RPE 10 → DIMINUA a carga em 5-10% (recommendation_type: "decrease")
3. Incrementos recomendados:
   - Compostos (supino, agachamento, terra, remada, desenvolvimento): 2.5-5kg
   - Isolados (curl, extensão, elevação lateral, voador): 1-2.5kg
   - Iniciantes: podem progredir mais rápido (5-10kg em compostos)
   - Avançados: progressão mais lenta e calculada
4. Se o atleta ESTAGNA por 3+ sessões no mesmo peso → recommendation_type: "plateau". Preencha technique com uma técnica específica: "Drop Set", "Rest-Pause", "Myo-Reps" ou "Pausa-Ativação".
5. Se o atleta acumular RPE alto (≥ 8) por 3+ sessões consecutivas → recommendation_type: "deload". Reduza a carga em 20-30% para recuperação.
6. periodization_note: inclua quando houver alerta importante. Deixe vazio se não houver nada relevante.
7. A mensagem deve ser em português (pt-BR), motivacional e específica.

Responda APENAS no formato JSON especificado.`;
};

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      exerciseId:        { type: Type.NUMBER },
      exerciseName:      { type: Type.STRING },
      suggestedWeight:   { type: Type.NUMBER },
      message:           { type: Type.STRING },
      recommendation_type: { type: Type.STRING },
      technique:         { type: Type.STRING },
      periodization_note: { type: Type.STRING },
    },
    required: ['exerciseId', 'exerciseName', 'suggestedWeight', 'message', 'recommendation_type', 'technique', 'periodization_note'],
  },
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { workout, userProfile } = req.body ?? {};
  if (!workout?.exercises) {
    return res.status(400).json({ error: 'workout inválido' });
  }

  try {
    const prompt = buildPrompt(workout, userProfile);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.4,
      },
    });

    const raw: any[] = JSON.parse(response.text.trim());

    // Garantir sugestão válida para cada exercício
    const suggestions = workout.exercises.map((exercise: any) => {
      const sug = raw.find((s: any) => s.exerciseId === exercise.id);
      if (sug && typeof sug.suggestedWeight === 'number' && sug.suggestedWeight > 0) {
        return {
          ...sug,
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          currentWeight: exercise.currentWeight,
          recommendation_type: sug.recommendation_type || 'maintain',
          technique: sug.technique || null,
          periodization_note: sug.periodization_note || null,
        };
      }
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        suggestedWeight: exercise.currentWeight,
        currentWeight: exercise.currentWeight,
        message: 'Mantenha a carga atual e foque na execução perfeita.',
        recommendation_type: 'maintain',
        technique: null,
        periodization_note: null,
      };
    });

    res.status(200).json(suggestions);
  } catch (err: any) {
    console.error('[ai-suggest]', err?.message ?? err);
    res.status(500).json({ error: err?.message ?? 'Erro interno' });
  }
}
