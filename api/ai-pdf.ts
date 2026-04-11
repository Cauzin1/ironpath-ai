import { GoogleGenAI, Type, FileState } from '@google/genai';

type Req = { method: string; body: any };
type Res = { status: (c: number) => Res; json: (d: any) => void };

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const pdfParserSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      scheduledDays: { type: Type.STRING },
      exercises: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            sets: { type: Type.NUMBER },
            reps: { type: Type.NUMBER },
          },
          required: ['name', 'sets', 'reps'],
        },
      },
    },
    required: ['name', 'exercises'],
  },
};

const PDF_PROMPT = `Analise este PDF de ficha de treino.

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

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pdfBase64 } = req.body ?? {};
  if (!pdfBase64 || typeof pdfBase64 !== 'string') {
    return res.status(400).json({ error: 'pdfBase64 ausente ou inválido' });
  }

  // Check base64 size (~4.5MB Vercel limit, check original binary size)
  const estimatedBytes = (pdfBase64.length * 3) / 4;
  if (estimatedBytes > 20 * 1024 * 1024) {
    return res.status(413).json({ error: 'PDF muito grande. Tamanho máximo: 20MB.' });
  }

  let uploadedFileName: string | undefined;

  try {
    // base64 → Buffer → Blob
    const buffer = Buffer.from(pdfBase64, 'base64');
    const blob = new Blob([buffer], { type: 'application/pdf' });

    const uploaded = await ai.files.upload({
      file: blob,
      config: { mimeType: 'application/pdf', displayName: 'workout.pdf' },
    });
    uploadedFileName = uploaded.name;

    // Poll until ACTIVE (max 20 attempts × 2s = 40s)
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: PDF_PROMPT },
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

    const parsed = JSON.parse(raw.trim());

    let idCounter = 1;
    const workouts = parsed.map((w: any) => ({
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

    res.status(200).json(workouts);
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('[ai-pdf]', msg);
    res.status(500).json({ error: `Falha ao ler o PDF: ${msg}` });
  } finally {
    if (uploadedFileName) {
      ai.files.delete({ name: uploadedFileName }).catch(() => {});
    }
  }
}
