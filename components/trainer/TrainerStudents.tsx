import React, { useState } from 'react';
import { TrainerStudent, TrainerInvite, TrainerWorkout } from '../../types';
import { UsersIcon, CopyIcon, TrashIcon } from '../icons';
import {
  generateInviteCode,
  getMyInviteCode,
  removeStudent,
} from '../../services/trainerService';

interface TrainerStudentsProps {
  trainerId: string;
  trainerName: string;
  students: TrainerStudent[];
  trainerWorkouts: TrainerWorkout[];
  onStudentsChange: () => void;
}

export const TrainerStudents: React.FC<TrainerStudentsProps> = ({
  trainerId,
  trainerName,
  students,
  onStudentsChange,
}) => {
  const [invite, setInvite] = useState<TrainerInvite | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing invite code on demand
  const handleShowCode = async () => {
    setGeneratingCode(true);
    setError(null);
    try {
      let code = await getMyInviteCode(trainerId);
      if (!code) {
        const newCode = await generateInviteCode(trainerId, trainerName);
        code = { id: '', trainer_id: trainerId, trainer_name: trainerName, code: newCode, created_at: '' };
      }
      setInvite(code);
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
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div className="p-5 space-y-5 pb-28 animate-fade-in">
      {/* Header */}
      <div className="pt-1">
        <h1 className="text-2xl font-black text-white">Meus Alunos</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {students.length} aluno{students.length !== 1 ? 's' : ''} vinculado{students.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start justify-between bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white ml-2 text-lg">×</button>
        </div>
      )}

      {/* Invite code section */}
      {!invite ? (
        <button
          onClick={handleShowCode}
          disabled={generatingCode}
          className="w-full flex items-center gap-3 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 active:scale-95 transition-all rounded-2xl p-4"
        >
          <div className="w-10 h-10 bg-emerald-600/30 border border-emerald-500/40 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
            🔗
          </div>
          <div className="text-left flex-1">
            <p className="text-emerald-300 font-bold text-sm">
              {generatingCode ? 'Gerando...' : 'Convidar Aluno'}
            </p>
            <p className="text-emerald-700 text-xs">Gerar código de convite para compartilhar</p>
          </div>
          {generatingCode && (
            <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin flex-shrink-0" />
          )}
        </button>
      ) : (
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Código de Convite</p>
            <button onClick={() => setInvite(null)} className="text-gray-600 hover:text-gray-400 text-sm">Fechar</button>
          </div>

          {/* Code display */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-900/80 border border-emerald-500/30 rounded-xl py-4 px-5 text-center">
              <span className="text-3xl font-black text-white tracking-[0.3em]">{invite.code}</span>
            </div>
            <button
              onClick={handleCopy}
              className="w-12 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all flex-shrink-0"
              title="Copiar código"
            >
              {copied ? <span className="text-lg">✓</span> : <CopyIcon className="w-5 h-5" />}
            </button>
          </div>

          <p className="text-gray-500 text-xs text-center">
            Compartilhe este código com seu aluno. Ele deve digitá-lo na aba Perfil.
          </p>

          <button
            onClick={handleNewCode}
            disabled={generatingCode}
            className="w-full py-2.5 rounded-xl border border-emerald-700/30 text-emerald-600 text-sm font-semibold hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
          >
            {generatingCode ? 'Gerando...' : 'Gerar Novo Código'}
          </button>
        </div>
      )}

      {/* Students list */}
      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-gray-800 p-5 rounded-full mb-4">
            <UsersIcon className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-white font-bold">Nenhum aluno vinculado</p>
          <p className="text-gray-500 text-sm mt-1">Use o código de convite acima para adicionar alunos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map(student => {
            const isConfirming = removeConfirmId === student.id;
            return (
              <div key={student.id} className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  {/* Avatar placeholder */}
                  <div className="w-11 h-11 rounded-full bg-indigo-900/40 border border-indigo-700/30 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {student.student_name.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold leading-tight truncate">{student.student_name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Vinculado em {formatDate(student.joined_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setRemoveConfirmId(isConfirming ? null : student.id)}
                    className="p-2.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remover aluno"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Remove confirm */}
                {isConfirming && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setRemoveConfirmId(null)}
                      disabled={removing}
                      className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleRemove(student.id)}
                      disabled={removing}
                      className="flex-1 py-3 rounded-xl bg-red-900/60 border border-red-700/50 text-red-300 text-sm font-semibold hover:bg-red-900 transition-colors flex items-center justify-center"
                    >
                      {removing ? (
                        <div className="w-4 h-4 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" />
                      ) : 'Remover'}
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
