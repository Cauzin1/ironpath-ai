// DietUpload.jsx
import { useState } from 'react';
import { Upload, FileText, Check, X } from 'lucide-react';
import { supabase } from '../supaBaseClient';

export default function DietUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Apenas arquivos PDF são permitidos');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Arquivo muito grande (máx. 5MB)');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Gerar nome único para o arquivo
      const fileName = `diet_${Date.now()}_${file.name}`;
      const filePath = `diet-pdfs/${fileName}`;

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('diet-files')
        .upload(filePath, file);

      if (error) throw error;

      // Salvar metadata no banco
      const { error: dbError } = await supabase
        .from('diet_uploads')
        .insert({
          file_name: fileName,
          file_path: filePath,
          uploaded_at: new Date().toISOString(),
          file_size: file.size,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (dbError) throw dbError;

      setUploadedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(2),
        uploadedAt: new Date().toLocaleTimeString()
      });

      // Opcional: Processar PDF para extrair dados (você pode usar uma API ou biblioteca)

    } catch (err) {
      setError('Erro ao fazer upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Importar Dieta (PDF)
        </h2>
        <Upload className="w-5 h-5 text-blue-500" />
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        
        <label
          htmlFor="file-upload"
          className={`cursor-pointer flex flex-col items-center justify-center ${uploading ? 'opacity-50' : ''}`}
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            {uploading ? (
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Upload className="w-8 h-8 text-blue-500" />
            )}
          </div>
          
          <p className="font-medium text-gray-700 mb-2">
            {uploading ? 'Processando...' : 'Clique para importar dieta'}
          </p>
          <p className="text-sm text-gray-500">PDF até 5MB</p>
        </label>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <X className="w-4 h-4 text-red-500" />
          <span className="text-red-600 text-sm">{error}</span>
        </div>
      )}

      {uploadedFile && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium text-green-800">
                  Upload concluído!
                </span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                {uploadedFile.name} • {uploadedFile.size} KB
              </p>
            </div>
            <span className="text-xs text-green-500">
              {uploadedFile.uploadedAt}
            </span>
          </div>
          
          <button className="mt-3 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            Processar Informações
          </button>
        </div>
      )}
    </div>
  );
}