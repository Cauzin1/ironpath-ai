import React, { useState } from 'react';
import { TrainerStudent, TrainerInvite } from '../../types';
import { UsersIcon, CopyIcon, TrashIcon } from '../icons';
import { generateInviteCode, getMyInviteCode, removeStudent } from '../../services/trainerService';

interface TrainerStudentsProps {
  trainerId: string;
  trainerName: string;
  students: TrainerStudent[];
  onStudentsChange: () => void;
}

// Gradient palette for student avatars
const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-cyan-500 to-blue-600',
  'from-teal-500 to-emerald-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-violet-600',
  'from-lime-500 to-green-600',
];

function avatarGradient(name: string): string {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
}

export const TrainerStudents: React.FC<TrainerStudentsProps> = ({
  trainerId,
  trainerName,
  students,
  onStudentsChange,
}) => {
  const [invite, setInvite] = useState<TrainerInvite | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShowCode = async () => {
    if (invite) { setShowInvite(v => !v); return; }
    setGeneratingCode(true);
    setError(null);
    try {
      let code = await getMyInviteCode(trainerId);
      if (!code) {
        const newCode = await generateInviteCode(trainerId, trainerName);
        code = { id: '', trainer_id: trainerId, trainer_name: trainerName, code: newCode, created_at: '' };
      }
      setInvite(code);
      setShowInvite(true);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao gerar código.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleNewCode = async () => {
    setGeneratingCode(true);
    setError(null);
    try {
      const newCode = await generateInviteCode(trainerId, trainerName);
      setInvite(prev => prev ? { ...prev, code: newCode } : null);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao gerar código.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopy = () => {
    if (!invite) return;
    navigator.clipboard.writeText(invite.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRemove = async (id: string) => {
    setRemoving(true);
    try {
      await removeStudent(id);
      setRemoveConfirmId(null);
      onStudentsChange();
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao remover aluno.');
    } finally {
      setRemoving(false);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="px-4 pt-4 pb-28 space-y-4 animate-fade-in">

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between bg-red-900/20 border border-red-700/30 rounded-2xl px-4 py-3">
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white ml-2 text-xl leading-none">×</button>
        </div>
      )}

      {/* Stats + Invite row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Student count */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-3xl font-black text-white">{students.length}</p>
          <p className="text-gray-500 text-xs mt-1">Aluno{students.length !== 1 ? 's' : ''} vinculado{students.length !== 1 ? 's' : ''}</p>
        </div>
        {/* Invite button */}
        <button
          onClick={handleShowCode}
          disabled={generatingCode}
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-left hover:bg-emerald-500/15 active:scale-95 transition-all"
        >
          <div className="text-2xl mb-1">{generatingCode ? '⏳' : '🔗'}</div>
          <p className="text-emerald-400 text-xs font-bold">
            {generatingCode ? 'Gerando...' : showInvite ? 'Ocultar código' : 'Código de convite'}
          </p>
        </button>
      </div>

      {/* Invite code panel */}
      {showInvite && invite && (
        <div className="bg-gray-900 border border-emerald-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Código de Convite</p>
            <button
              onClick={handleNewCode}
              disabled={generatingCode}
              className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
            >
              {generatingCode ? 'Gerando...' : '↻ Novo código'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-950 border border-gray-700 rounded-xl py-4 text-center">
              <span className="text-3xl font-black text-white tracking-[0.35em] font-mono">{invite.code}</span>
            </div>
            <button
              onClick={handleCopy}
              className={`w-14 h-14 rounded-xl flex items-center justify-center active:scale-95 transition-all flex-shrink-0 ${copied ? 'bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-500'}`}
            >
              {copied
                ? <span className="text-white text-xl">✓</span>
                : <CopyIcon className="w-5 h-5 text-white" />}
            </button>
          </div>
          <p className="text-gray-600 text-xs text-center">Peça ao aluno para digitar este código na aba Perfil do app</p>
        </div>
      )}

      {/* Students list */}
      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 text-4xl">
            👥
          </div>
          <p className="text-white font-bold text-lg">Nenhum aluno ainda</p>
          <p className="text-gray-500 text-sm mt-1 max-w-xs">Gere um código de convite e compartilhe com seus alunos</p>
          <button
            onClick={handleShowCode}
            disabled={generatingCode}
            className="mt-5 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl active:scale-95 transition-all text-sm"
          >
            {generatingCode ? 'Gerando...' : '🔗 Gerar Código de Convite'}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider px-1">Lista de alunos</p>
          {students.map((student) => {
            const isConfirming = removeConfirmId === student.id;
            const initial = student.student_name.charAt(0).toUpperCase() || '?';
            return (
              <div
                key={student.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  {/* Colored avatar */}
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarGradient(student.student_name)} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <span className="text-white font-black text-lg">{initial}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold leading-tight truncate">{student.student_name}</p>
                    <p className="text-gray-600 text-xs mt-0.5">Desde {formatDate(student.joined_at)}</p>
                  </div>
                  <button
                    onClick={() => setRemoveConfirmId(isConfirming ? null : student.id)}
                    className={`p-2 rounded-xl transition-colors ${isConfirming ? 'bg-red-900/30 text-red-400' : 'text-gray-600 hover:text-red-400 hover:bg-red-900/20'}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                {isConfirming && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setRemoveConfirmId(null)}
                      disabled={removing}
                      className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleRemove(student.id)}
                      disabled={removing}
                      className="flex-1 py-2.5 rounded-xl bg-red-900/50 border border-red-700/40 text-red-300 text-sm font-semibold hover:bg-red-900/80 transition-colors flex items-center justify-center"
                    >
                      {removing
                        ? <div className="w-4 h-4 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" />
                        : 'Remover aluno'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
