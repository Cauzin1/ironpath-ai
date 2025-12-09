import { GoogleGenAI, Type } from "@google/genai";
import { Workout, Suggestion, Exercise } from '../types';

// Assume API_KEY is set in the environment
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder. AI features will not work.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const generateSuggestionPrompt = (workout: Workout): string => {
  const performanceDetails = workout.exercises.map(ex => `
    - Exercise: ${ex.name} (ID: ${ex.id})
      - Target: ${ex.sets} sets of ${ex.reps} reps.
      - Weight Used: ${ex.currentWeight} kg.
      - Completed Sets: ${ex.completedSets.length} out of ${ex.sets}.
  `).join('');

  return `
    Analyze the following workout session for a user and provide suggestions for their next one.
    Workout Name: ${workout.name}

    Performance Details:
    ${performanceDetails}

    For each exercise, calculate the suggested weight for the next session using this progressive overload logic:
    1. If all sets were completed successfully, increase the weight by a small increment (e.g., 2.5kg for compound lifts like Bench Press, 1-2kg for isolation exercises like Lateral Raises).
    2. If the user completed most sets but likely struggled on the last one (e.g., completed all but one set), suggest keeping the weight the same to solidify form and build confidence.
    3. If the user failed to complete a significant number of sets (e.g., two or more sets incomplete), suggest a slight decrease in weight to focus on volume and proper technique.

    Also, provide a short, motivational, and helpful message (in Portuguese) for each exercise. Your response must be in the specified JSON format.
  `;
};

const suggestionResponseSchema = {
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
          description: 'A short, motivational message in Portuguese for the user regarding this exercise.',
        },
      },
      required: ["exerciseId", "exerciseName", "suggestedWeight", "message"],
    },
};

export const getAIWorkoutSuggestions = async (workout: Workout): Promise<Suggestion[]> => {
    try {
        const prompt = generateSuggestionPrompt(workout);
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: suggestionResponseSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const suggestions: Suggestion[] = JSON.parse(jsonText);
        
        return workout.exercises.map(exercise => {
            const suggestion = suggestions.find(s => s.exerciseId === exercise.id);
            if(suggestion) return suggestion;
            
            return {
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                suggestedWeight: exercise.currentWeight,
                message: "Não foi possível gerar uma sugestão. Tente manter o peso e focar na forma."
            }
        });
        
    } catch (error) {
        console.error("Error fetching AI suggestions:", error);
        throw new Error("Failed to get suggestions from AI. Please check your API key and try again.");
    }
};


const pdfParserSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "The name of the workout day (e.g., 'Treino A - Peito e Tríceps', 'Push Day').",
        },
        exercises: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "The name of the exercise (e.g., 'Supino Reto').",
              },
              sets: {
                type: Type.NUMBER,
                description: "The number of sets for the exercise.",
              },
              reps: {
                type: Type.NUMBER,
                description: "The number of repetitions per set.",
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
            Analyze the provided workout plan PDF. Identify the different workout days or splits (e.g., Treino A, Treino B, Push, Pull, Legs).
            For each workout day, extract all the exercises listed.
            For each exercise, identify the number of sets and repetitions.
            Return the data as a JSON array, where each object represents a workout day.
            Your response must be only the JSON, adhering to the provided schema. Do not include any explanatory text.
            If the PDF contains tables, parse them correctly. Pay close attention to exercise names, sets, and reps.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
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

        const jsonText = response.text.trim();
        const parsedWorkouts = JSON.parse(jsonText);

        let exerciseIdCounter = 1;
        // Map the parsed data to our app's Workout structure
        const formattedWorkouts: Workout[] = parsedWorkouts.map((workout: any) => ({
            name: workout.name,
            exercises: workout.exercises.map((ex: any) => ({
                id: exerciseIdCounter++,
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                currentWeight: 0, // Default value
                completedSets: [], // Default value
                history: [], // Default value
            })),
        }));

        return formattedWorkouts;

    } catch (error) {
        console.error("Error processing PDF with AI:", error);
        throw new Error("Failed to parse workout from PDF. The document might be in an unsupported format or corrupted.");
    }
};