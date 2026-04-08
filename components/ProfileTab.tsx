import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { UserIcon, BellIcon } from './icons';
import { supabase } from '../supaBaseClient';
import type { ReminderConfig } from '../hooks/useWorkoutReminder';

interface NotificationSettings {
  permission: NotificationPermission;
  config: ReminderConfig;
  requestPermission: () => Promise<NotificationPermission>;
  saveConfig: (c: ReminderConfig) => void;
  isSupported: boolean;
}

interface ProfileTabProps {
  profile: UserProfile;
  email?: string;
  userId: string;
  onAvatarUpdate: (url: string) => void;
  onProfileUpdate: (profile: UserProfile) => void;
  onLogout: () => Promise<any>;
  notifications: NotificationSettings;
}

const LEVELS = [
  { value: 'iniciante',     label: 'Iniciante (< 6 meses)' },
  { value: 'intermediario', label: 'Intermediário (6m – 2 anos)' },
  { value: 'avancado',      label: 'Avançado (> 2 anos)' },
];

const GOALS = [
  { value: 'hipertrofia',   label: 'Hipertrofia' },
  { value: 'emagrecimento', label: 'Emagrecimento' },
  { value: 'forca',         label: 'Força' },
  { value: 'resistencia',   label: 'Resistência' },
];

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  email,
  userId,
  onAvatarUpdate,
  onProfileUpdate,
  onLogout,
  notifications,
}) => {
  const [loggingOut, setLoggingOut]   = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData]   = useState({
    weight: String(profile.weight),
    height: String(profile.height),
    age:    String(profile.age),
    experience_level: profile.experience_level,
    goal:   profile.goal,
  });
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await onLogout(); } catch { setLoggingOut(false); }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadError('Selecione uma imagem (JPG, PNG, etc.)'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('A imagem deve ter no máximo 5MB.'); return; }

    setUploading(true);
    setUploadError(null);
    try {
      const ext  = file.name.split('.').pop() ?? 'jpg';
      const path = `${userId}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', userId);
      onAvatarUpdate(publicUrl);
    } catch (err: any) {
      setUploadError(err?.message ?? 'Erro ao enviar foto. Tente novamente.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updates = {
        weight:           parseFloat(editData.weight) || profile.weight,
        height:           parseFloat(editData.height) || profile.height,
        age:              parseInt(editData.age)       || profile.age,
        experience_level: editData.experience_level,
        goal:             editData.goal,
      };
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);
      if (error) throw error;
      onProfileUpdate({ ...profile, ...updates });
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile.name ?? email ?? 'A').charAt(0).toUpperCase();

  return (
    <div className="p-6 space-y-6 animate-fade-in pb-24">

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
              <img src={profile.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-gray-300">{initials}</span>
            )}
          </div>
          <div className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/50 transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {uploading
              ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span className="text-white text-xs font-bold">Editar</span>
            }
          </div>
        </button>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <p className="text-xs text-gray-500 mt-2">Toque na foto para alterar</p>
        {uploadError && <p className="text-red-400 text-xs mt-1 text-center">{uploadError}</p>}

        <h2 className="text-xl font-bold text-white mt-3 truncate max-w-full">{profile.name ?? 'Atleta'}</h2>
        <p className="text-gray-500 text-sm truncate max-w-full">{email}</p>
      </div>

      {/* Dados do perfil */}
      {!isEditing ? (
        <>
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
            onClick={() => {
              setEditData({
                weight: String(profile.weight),
                height: String(profile.height),
                age:    String(profile.age),
                experience_level: profile.experience_level,
                goal:   profile.goal,
              });
              setSaveError(null);
              setIsEditing(true);
            }}
            className="w-full bg-gray-800 border border-gray-700 text-white font-semibold py-4 rounded-xl hover:bg-gray-700 transition-colors min-h-[44px]"
          >
            Editar Dados
          </button>
        </>
      ) : (
        /* Formulário de edição */
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-4 space-y-4">
          <p className="text-white font-bold text-sm mb-1">Editar Dados</p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Peso (kg)', key: 'weight', mode: 'decimal' as const },
              { label: 'Altura (cm)', key: 'height', mode: 'numeric' as const },
              { label: 'Idade',      key: 'age',    mode: 'numeric' as const },
            ].map(({ label, key, mode }) => (
              <div key={key}>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</label>
                <input
                  type="number"
                  inputMode={mode}
                  value={editData[key as keyof typeof editData]}
                  onChange={e => setEditData(d => ({ ...d, [key]: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 outline-none"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nível</label>
            <select
              value={editData.experience_level}
              onChange={e => setEditData(d => ({ ...d, experience_level: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 outline-none"
            >
              {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Objetivo</label>
            <select
              value={editData.goal}
              onChange={e => setEditData(d => ({ ...d, goal: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 outline-none"
            >
              {GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          {saveError && (
            <p className="text-red-400 text-xs">{saveError}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setIsEditing(false)}
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl bg-gray-700 text-gray-300 font-semibold hover:bg-gray-600 transition-colors min-h-[44px] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors min-h-[44px] disabled:opacity-50 flex items-center justify-center"
            >
              {saving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Salvar'
              }
            </button>
          </div>
        </div>
      )}

      {/* Lembretes de treino */}
      {notifications.isSupported && (
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <BellIcon className="w-4 h-4 text-indigo-400" />
            <p className="text-white font-bold text-sm">Lembretes de Treino</p>
          </div>

          {notifications.permission === 'denied' ? (
            <p className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded-xl px-3 py-2">
              Notificações bloqueadas pelo navegador. Habilite nas configurações do dispositivo.
            </p>
          ) : notifications.permission === 'default' ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">Ative para receber um lembrete quando não treinar no horário escolhido.</p>
              <button
                onClick={async () => {
                  const result = await notifications.requestPermission();
                  if (result === 'granted') {
                    notifications.saveConfig({ ...notifications.config, enabled: true });
                  }
                }}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors active:scale-95 min-h-[44px]"
              >
                Permitir Notificações
              </button>
            </div>
          ) : (
            /* permission === 'granted' */
            <div className="space-y-4">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Ativar lembretes</span>
                <button
                  onClick={() => notifications.saveConfig({ ...notifications.config, enabled: !notifications.config.enabled })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notifications.config.enabled ? 'bg-indigo-600' : 'bg-gray-600'
                  }`}
                  aria-label="Toggle lembretes"
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    notifications.config.enabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Time picker */}
              {notifications.config.enabled && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Horário do lembrete</label>
                  <input
                    type="time"
                    value={notifications.config.time}
                    onChange={e => notifications.saveConfig({ ...notifications.config, time: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 outline-none"
                  />
                  <p className="text-[11px] text-gray-500">
                    Você receberá uma notificação neste horário nos dias em que não treinar.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sair */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full bg-red-900/20 border border-red-900/50 text-red-400 font-bold py-4 rounded-xl hover:bg-red-900/40 transition-colors disabled:opacity-50 min-h-[44px]"
      >
        {loggingOut ? 'Saindo...' : 'Sair da Conta'}
      </button>
    </div>
  );
};
