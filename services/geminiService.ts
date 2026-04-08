import { GoogleGenAI, Type, FileState } from "@google/genai";
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
6. periodization_note: inclua quando houver alerta importante (ex: "Aumente reps antes de aumentar carga", "Progresso excelente — mantenha o ritmo", "Sinal de fadiga acumulada"). Deixe vazio se não houver nada relevante.
7. A mensagem deve ser em português (pt-BR), motivacional, específica para o exercício e o contexto do atleta.

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
      message: { type: Type.STRING, description: 'Mensagem motivacional em português (pt-BR), específica para o exercício e contexto do atleta.' },
      recommendation_type: { type: Type.STRING, description: 'Tipo de recomendação: "increase" (aumentar carga), "maintain" (manter carga), "decrease" (reduzir carga), "deload" (deload recomendado), "plateau" (estagnação — usar technique).' },
      technique: { type: Type.STRING, description: 'Técnica especial se recommendation_type for "plateau" (ex: "Drop Set", "Rest-Pause", "Myo-Reps", "Pausa-Ativação"). String vazia se não aplicável.' },
      periodization_note: { type: Type.STRING, description: 'Nota de periodização se relevante (ex: "Aumente reps antes de aumentar carga", "Considere 1 semana de deload"). String vazia se não aplicável.' },
    },
    required: ["exerciseId", "exerciseName", "suggestedWeight", "message", "recommendation_type", "technique", "periodization_note"],
  },
};

const pdfParserSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Nome completo do dia de treino (ex: 'Treino A - Peito e Tríceps', 'Push Day', 'Dia 1 - Membros Superiores')." },
      scheduledDays: { type: Type.STRING, description: "Dias da semana indicados para este treino (ex: 'Segunda e Quinta'). String vazia se não especificado." },
      exercises: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nome do exercício (ex: 'Supino Reto com Barra')." },
            sets: { type: Type.NUMBER, description: "Número de séries. Se faixa (ex: 3-4), use o maior valor (4)." },
            reps: { type: Type.NUMBER, description: "Número de repetições por série. Se faixa (ex: 8-12), use o maior valor (12)." },
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
        message: "Mantenha a carga atual e foque na execução perfeita.",
        recommendation_type: 'maintain' as const,
        technique: null,
        periodization_note: null,
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

export const getWorkoutFromPDF = async (pdfBase64: string): Promise<Workout[]> => {
  let uploadedFileName: string | undefined;

  try {
    // Convert base64 → Blob so we can use the Files API
    const binary = atob(pdfBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/pdf' });

    // Upload via Files API (avoids inline-data permission restrictions)
    const uploaded = await ai.files.upload({
      file: blob,
      config: { mimeType: 'application/pdf', displayName: 'workout.pdf' },
    });
    uploadedFileName = uploaded.name;

    // Poll until the file is ready
    let fileInfo = uploaded;
    let attempts = 0;
    while (fileInfo.state === FileState.PROCESSING && attempts < 20) {
      await new Promise(r => setTimeout(r, 2000));
      fileInfo = await ai.files.get({ name: uploadedFileName! });
      attempts++;
    }

    if (fileInfo.state !== FileState.ACTIVE) {
      throw new Error(`Arquivo não ficou pronto (estado: ${fileInfo.state}).`);
    }

    const prompt = `Analise este PDF de ficha de treino.

TAREFA: Identificar CADA divisão de treino separadamente e extrair seus exercícios.

COMO IDENTIFICAR DIVISÕES:
- Procure por cabeçalhos como: "Treino A", "Treino B", "Dia 1", "Dia 2", "Push", "Pull", "Legs", "Upper", "Lower", "Peito", "Costas"
- Separadores visuais como linhas, caixas, títulos em negrito ou caixa alta também indicam nova divisão
- Cada divisão identificada deve gerar um objeto SEPARADO no array
- NUNCA misture exercícios de divisões diferentes no mesmo objeto

COMO EXTRAIR:
- Para faixas de séries (ex: "3-4"), use o número MAIOR (4)
- Para faixas de reps (ex: "8-12"), use o número MAIOR (12)
- Se houver dias da semana indicados para a divisão (ex: "Segunda e Quinta"), preencha scheduledDays
- Ignore aquecimento, observações, notas e alongamento

Retorne APENAS o JSON, sem texto adicional.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { fileData: { mimeType: 'application/pdf', fileUri: fileInfo.uri! } },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: pdfParserSchema,
      },
    });

    const raw = response.text ?? '';
    if (!raw.trim()) throw new Error('Resposta vazia da IA.');

    const parsedWorkouts = JSON.parse(raw.trim());

    let idCounter = 1;
    return parsedWorkouts.map((w: any) => ({
      name: w.name,
      scheduledDays: w.scheduledDays || '',
      exercises: w.exercises.map((ex: any) => ({
        id: idCounter++,
        name: ex.name,
        sets: typeof ex.sets === 'number' ? ex.sets : parseInt(ex.sets) || 3,
        reps: typeof ex.reps === 'number' ? ex.reps : parseInt(ex.reps) || 10,
        currentWeight: 0,
        completedSets: [],
        isFinished: false,
        history: [],
      })),
    }));

  } catch (error: any) {
    const msg = error?.message ?? String(error);
    console.error('Erro ao processar PDF:', msg);
    throw new Error(`Falha ao ler o PDF: ${msg}`);
  } finally {
    // Always clean up the uploaded file
    if (uploadedFileName) {
      ai.files.delete({ name: uploadedFileName }).catch(() => {});
    }
  }
};
