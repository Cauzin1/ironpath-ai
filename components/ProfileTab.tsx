import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { UserIcon } from './icons';
import { supabase } from '../supaBaseClient';

interface ProfileTabProps {
  profile: UserProfile;
  email?: string;
  userId: string;
  onAvatarUpdate: (url: string) => void;
  onLogout: () => Promise<any>;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ profile, email, userId, onAvatarUpdate, onLogout }) => {
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
    } catch {
      setLoggingOut(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate: image only, max 5MB
    if (!file.type.startsWith('image/')) {
      setUploadError('Selecione uma imagem (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${userId}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`; // bust cache

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', userId);
      onAvatarUpdate(publicUrl);
    } catch (err: any) {
      setUploadError(err?.message ?? 'Erro ao enviar foto. Tente novamente.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const initials = (profile.name ?? email ?? 'A').charAt(0).toUpperCase();

  return (
    <div className="p-6 space-y-6 animate-fade-in pb-32">
      {/* Avatar */}
      <div className="flex flex-col items-center mt-6">
        <button
          onClick={handleAvatarClick}
          disabled={uploading}
          className="relative group focus:outline-none"
          title="Alterar foto"
        >
          <div className="w-24 h-24 rounded-full border-4 border-gray-700 shadow-2xl overflow-hidden bg-gray-800 flex items-center justify-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-black text-gray-300">{initials}</span>
            )}
          </div>

          {/* Overlay on hover/upload */}
          <div className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/50 transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {uploading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="text-white text-xs font-bold">Editar</span>
            )}
          </div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <p className="text-xs text-gray-500 mt-2">Toque na foto para alterar</p>

        {uploadError && (
          <p className="text-red-400 text-xs mt-1 text-center">{uploadError}</p>
        )}

        <h2 className="text-xl font-bold text-white mt-3">{profile.name ?? 'Atleta'}</h2>
        <p className="text-gray-500 text-sm">{email}</p>
      </div>

      {/* Profile info */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-4 space-y-4">
        <div className="flex justify-between border-b border-gray-700 pb-3">
          <span className="text-gray-400">Idade</span>
          <span className="text-white font-bold">{profile.age} anos</span>
        </div>
        <div className="flex justify-between border-b border-gray-700 pb-3">
          <span className="text-gray-400">Peso</span>
          <span className="text-white font-bold">{profile.weight} kg</span>
        </div>
        <div className="flex justify-between border-b border-gray-700 pb-3">
          <span className="text-gray-400">Altura</span>
          <span className="text-white font-bold">{profile.height} cm</span>
        </div>
        <div className="flex justify-between border-b border-gray-700 pb-3">
          <span className="text-gray-400">Nível</span>
          <span className="text-white font-bold capitalize">{profile.experience_level}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Objetivo</span>
          <span className="text-white font-bold capitalize">{profile.goal}</span>
        </div>
      </div>

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full bg-red-900/20 border border-red-900/50 text-red-400 font-bold py-4 rounded-xl hover:bg-red-900/40 transition-colors disabled:opacity-50"
      >
        {loggingOut ? 'Saindo...' : 'Sair da Conta'}
      </button>
    </div>
  );
};
