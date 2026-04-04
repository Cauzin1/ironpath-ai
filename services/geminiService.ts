import { GoogleGenAI, Type } from "@google/genai";
import { Workout, Suggestion, Exercise, UserProfile } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("API_KEY não definida. Funcionalidades de IA não funcionarão.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isCompoundLift = (name: string): boolean => {
  const compounds = [
    'supino', 'agachamento', 'levantamento terra', 'terra', 'remada',
    'desenvolvimento', 'barra fixa', 'paralela', 'leg press', 'stiff',
    'bench press', 'squat', 'deadlift', 'row', 'press', 'pull',
  ];
  const lower = name.toLowerCase();
  return compounds.some(c => lower.includes(c));
};

const formatHistory = (exercise: Exercise): string => {
  if (!exercise.history || exercise.history.length === 0) {
    return '    Sem histórico — primeira vez realizando este exercício.';
  }
  const last5 = [...exercise.history].slice(-5);
  return last5.map(h => {
    const date = new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const rpeStr = h.rpe != null ? `, RPE ${h.rpe}/10` : '';
    return `    - ${date}: ${h.weight}kg × ${h.reps} reps${rpeStr}`;
  }).join('\n');
};

const generateSuggestionPrompt = (workout: Workout, userProfile: UserProfile | null): string => {
  const profileSection = userProfile
    ? `PERFIL DO ATLETA:
  - Objetivo: ${userProfile.goal}
  - Nível: ${userProfile.experience_level}
  - Peso corporal: ${userProfile.weight}kg
  - Idade: ${userProfile.age} anos
  - Gênero: ${userProfile.gender}`
    : 'PERFIL DO ATLETA: Não informado — use progressão conservadora.';

  const exerciseDetails = workout.exercises.map(ex => {
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
   - Todas as séries completas + RPE ≤ 7 → AUMENTE a carga
   - Todas as séries completas + RPE 8-9 → MANTENHA (consolide a técnica)
   - Todas as séries completas + sem RPE → aumente moderadamente
   - 1 série perdida → MANTENHA a carga
   - 2+ séries perdidas ou RPE 10 → DIMINUA a carga em 5-10%
3. Incrementos recomendados:
   - Compostos (supino, agachamento, terra, remada, desenvolvimento): 2.5-5kg
   - Isolados (curl, extensão, elevação lateral, voador): 1-2.5kg
   - Iniciantes: podem progredir mais rápido (5-10kg em compostos)
   - Avançados: progressão mais lenta e calculada
4. Se o atleta ESTAGNA por 3+ sessões no mesmo peso → sugira técnicas de plateau (drop sets, aumento de reps antes de aumentar carga)
5. A mensagem deve ser em português (pt-BR), motivacional, específica para o exercício e o contexto do atleta.

Responda APENAS no formato JSON especificado.`;
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const suggestionResponseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      exerciseId: { type: Type.NUMBER, description: 'ID do exercício.' },
      exerciseName: { type: Type.STRING, description: 'Nome do exercício.' },
      suggestedWeight: { type: Type.NUMBER, description: 'Carga sugerida em kg para a próxima sessão.' },
      message: { type: Type.STRING, description: 'Mensagem motivacional em português (pt-BR) sobre este exercício.' },
    },
    required: ["exerciseId", "exerciseName", "suggestedWeight", "message"],
  },
};

const pdfParserSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Nome do dia de treino (ex: 'Treino A - Peito e Tríceps')." },
      exercises: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nome do exercício (ex: 'Supino Reto')." },
            sets: { type: Type.NUMBER, description: "Número de séries." },
            reps: { type: Type.NUMBER, description: "Número de repetições por série." },
          },
          required: ["name", "sets", "reps"],
        },
      },
    },
    required: ["name", "exercises"],
  },
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const getAIWorkoutSuggestions = async (
  workout: Workout,
  userProfile: UserProfile | null = null
): Promise<Suggestion[]> => {
  try {
    const prompt = generateSuggestionPrompt(workout, userProfile);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: suggestionResponseSchema,
        temperature: 0.4, // Menos criativo, mais preciso para sugestões numéricas
      },
    });

    const suggestions: Suggestion[] = JSON.parse(response.text.trim());

    // Garantir que todos os exercícios tenham sugestão válida
    return workout.exercises.map(exercise => {
      const sug = suggestions.find(s => s.exerciseId === exercise.id);
      if (sug && typeof sug.suggestedWeight === 'number' && sug.suggestedWeight > 0) {
        return { ...sug, exerciseId: exercise.id, exerciseName: exercise.name, currentWeight: exercise.currentWeight };
      }
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        suggestedWeight: exercise.currentWeight,
        currentWeight: exercise.currentWeight,
        message: "Mantenha a carga atual e foque na execução perfeita.",
      };
    });

  } catch (error) {
    console.error("Erro nas sugestões da IA:", error);
    // Fallback conservador: manter cargas atuais
    return workout.exercises.map(e => ({
      exerciseId: e.id,
      exerciseName: e.name,
      suggestedWeight: e.currentWeight,
      currentWeight: e.currentWeight,
      message: "Sem conexão com a IA. Carga mantida por segurança.",
    }));
  }
};

export const getWorkoutFromPDF = async (pdfData: string): Promise<Workout[]> => {
  try {
    const prompt = `
      Analise o PDF de ficha de treino fornecido. Identifique os diferentes dias/divisões de treino (ex: Treino A, Treino B, Push, Pull, Legs).
      Para cada dia, extraia todos os exercícios com número de séries e repetições.
      Se um exercício tiver faixas (ex: "3-4 séries" ou "8-12 reps"), use o valor médio.
      Retorne APENAS o JSON sem texto explicativo.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'application/pdf', data: pdfData } },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: pdfParserSchema,
      },
    });

    const raw = response.text ?? '';
    if (!raw.trim()) throw new Error('Resposta vazia da IA.');

    const parsedWorkouts = JSON.parse(raw.trim());

    let idCounter = 1;
    return parsedWorkouts.map((w: any) => ({
      name: w.name,
      exercises: w.exercises.map((ex: any) => ({
        id: idCounter++,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        currentWeight: 0,
        completedSets: [],
        isFinished: false,
        history: [],
      })),
    }));

  } catch (error: any) {
    const msg = error?.message ?? String(error);
    console.error("Erro ao processar PDF:", msg);
    throw new Error(`Falha ao ler o PDF: ${msg}`);
  }
};
