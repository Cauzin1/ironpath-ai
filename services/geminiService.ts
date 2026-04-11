import { Workout, Suggestion, UserProfile } from '../types';

/**
 * Chama a Vercel API route /api/ai-suggest (server-side).
 * A chave GEMINI_API_KEY nunca é exposta no bundle do cliente.
 */
export const getAIWorkoutSuggestions = async (
  workout: Workout,
  userProfile: UserProfile | null = null
): Promise<Suggestion[]> => {
  try {
    const res = await fetch('/api/ai-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workout, userProfile }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error ?? `HTTP ${res.status}`);
    }

    return res.json();
  } catch (error: any) {
    console.error('Erro nas sugestões da IA:', error?.message ?? error);
    // Fallback conservador: manter cargas atuais
    return workout.exercises.map(e => ({
      exerciseId: e.id,
      exerciseName: e.name,
      suggestedWeight: e.currentWeight,
      currentWeight: e.currentWeight,
      message: 'Sem conexão com a IA. Carga mantida por segurança.',
      recommendation_type: 'maintain' as const,
      technique: null,
      periodization_note: null,
    }));
  }
};

/**
 * Chama a Vercel API route /api/ai-pdf (server-side).
 * Envia o base64 do PDF e recebe os treinos estruturados.
 */
export const getWorkoutFromPDF = async (pdfBase64: string): Promise<Workout[]> => {
  const res = await fetch('/api/ai-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfBase64 }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `HTTP ${res.status}`);
  }

  return res.json();
};
