import { GoogleGenAI, Type, Schema } from "@google/genai";
// Adicione UserProfile na importação
import { Workout, Suggestion, UserProfile } from '../types';

// AJUSTE 1: Correção da variável de ambiente para Vite
const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("VITE_GEMINI_API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// AJUSTE 2: Agora aceita 'profile' opcional
const generateSuggestionPrompt = (workout: Workout, profile?: UserProfile): string => {
  
  // Lógica de formatação do perfil
  const userContext = profile 
    ? `
      USER PROFILE (Context for weight progression):
      - Age: ${profile.age}
      - Body Weight: ${profile.weight} kg
      - Height: ${profile.height} cm
      - Gender: ${profile.gender}
      - Experience Level: ${profile.experience_level}
      - Goal: ${profile.goal}
      (Adjust suggestions based on experience level. Beginners progress faster, advanced users slower.)`
    : "User Profile: Not provided (Assume intermediate level).";

  const performanceDetails = workout.exercises.map(ex => `
    - Exercise: ${ex.name} (ID: ${ex.id})
      - Target: ${ex.sets} sets of ${ex.reps} reps.
      - Weight Used: ${ex.currentWeight} kg.
      - Completed Sets: ${ex.completedSets.length} out of ${ex.sets}.
  `).join('');

  return `
    You are an elite strength coach. Analyze the following workout session and provide suggestions for the NEXT session.
    
    ${userContext}

    Workout Name: ${workout.name}

    Performance Details:
    ${performanceDetails}

    For each exercise, calculate the suggested weight for the next session using this progressive overload logic:
    1. If all sets were completed successfully:
       - If Beginner: Suggest aggressive increase (2kg-4kg).
       - If Advanced: Suggest conservative increase (1kg-2kg) or maintenance.
    2. If the user completed most sets but struggled on the last one: Suggest keeping the weight.
    3. If the user failed sets: Suggest a slight decrease or maintenance to focus on form.

    Also, provide a short, motivational, and helpful message (in Portuguese) for each exercise. 
    Your response must be in the specified JSON format.
  `;
};

// Mantendo seu Schema original
const suggestionResponseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        exerciseId: {
          type: Type.NUMBER,
          description: 'The unique ID of the exercise.',
        },
        exerciseName: {
          type: Type.STRING,
          description: 'The name of the exercise.',
        },
        suggestedWeight: {
          type: Type.NUMBER,
          description: 'The suggested weight in kg for the next session.',
        },
        message: {
          type: Type.STRING,
          description: 'A short, motivational message in Portuguese.',
        },
      },
      required: ["exerciseId", "exerciseName", "suggestedWeight", "message"],
    },
};

// AJUSTE 3: Assinatura da função atualizada para receber profile
export const getAIWorkoutSuggestions = async (workout: Workout, profile?: UserProfile): Promise<Suggestion[]> => {
    try {
        const prompt = generateSuggestionPrompt(workout, profile);
        
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash", // Ajustado para versão compatível
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: suggestionResponseSchema,
                temperature: 0.7,
            },
        });

        // O SDK novo as vezes retorna null se falhar, bom garantir string vazia
        const jsonText = response.text ? response.text.trim() : "[]";
        const suggestions: Suggestion[] = JSON.parse(jsonText);
        
        return workout.exercises.map(exercise => {
            const suggestion = suggestions.find(s => s.exerciseId === exercise.id);
            if(suggestion) return suggestion;
            
            return {
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                suggestedWeight: exercise.currentWeight,
                message: "Mantenha o foco e a constância!"
            }
        });
        
    } catch (error) {
        console.error("Error fetching AI suggestions:", error);
        // Não quebra a aplicação, retorna array vazio em caso de erro da API
        return [];
    }
};

// Mantendo seu Schema de PDF original
const pdfParserSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "The name of the workout day (e.g., 'Treino A', 'Push Day').",
        },
        exercises: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "The name of the exercise.",
              },
              sets: {
                type: Type.NUMBER,
                description: "Number of sets.",
              },
              reps: {
                type: Type.NUMBER,
                description: "Number of reps.",
              },
            },
            required: ["name", "sets", "reps"],
          },
        },
      },
      required: ["name", "exercises"],
    },
};

export const getWorkoutFromPDF = async (pdfData: string): Promise<Workout[]> => {
    try {
        const prompt = `
            Analyze the provided workout plan PDF. Identify the different workout days.
            For each workout day, extract all the exercises, sets, and reps.
            Return ONLY the JSON matching the schema.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash", // Ajustado para versão compatível
            contents: { 
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: 'application/pdf',
                            data: pdfData,
                        },
                    },
                ] 
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: pdfParserSchema,
            },
        });

        const jsonText = response.text ? response.text.trim() : "[]";
        const parsedWorkouts = JSON.parse(jsonText);

        // Mapeamento para estrutura interna do App
        const formattedWorkouts: Workout[] = parsedWorkouts.map((workout: any) => ({
            name: workout.name,
            exercises: workout.exercises.map((ex: any, index: number) => ({
                id: Date.now() + Math.floor(Math.random() * 100000) + index, // ID mais seguro para React
                name: ex.name,
                sets: Number(ex.sets),
                reps: Number(ex.reps),
                currentWeight: 0, 
                completedSets: [], 
                isFinished: false, // Importante para o novo layout
                history: [], 
            })),
        }));

        return formattedWorkouts;

    } catch (error) {
        console.error("Error processing PDF with AI:", error);
        throw new Error("Falha ao ler o PDF. Tente um arquivo diferente.");
    }
};