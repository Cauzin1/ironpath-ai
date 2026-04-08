import React, { useState } from 'react';
import { TrainerWorkout, TrainerStudent } from '../../types';
import { WorkoutBuilder } from './WorkoutBuilder';
import { DumbbellIcon, TrashIcon, PlusCircleIcon } from '../icons';
import { saveTrainerWorkout, deleteTrainerWorkout, assignWorkoutToStudent } from '../../services/trainerService';

interface TrainerWorkoutsProps {
  trainerId: string;
  trainerName: string;
  workouts: TrainerWorkout[];
  students: TrainerStudent[];
  onWorkoutsChange: () => void;
}

export const TrainerWorkouts: React.FC<TrainerWorkoutsProps> = ({
  trainerId,
  trainerName,
  workouts,
  students,
  onWorkoutsChange,
}) => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [editing, setEditing] = useState<TrainerWorkout | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<TrainerWorkout | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // ── Builder handlers ────────────────────────────────────────────────────────

  const handleSave = async (name: string, wkts: TrainerWorkout['workouts']) => {
    await saveTrainerWorkout({
      id: editing?.id,
      trainer_id: trainerId,
      name,
      workouts: wkts,
    });
    setShowBuilder(false);
    setEditing(null);
    onWorkoutsChange();
  };

  const handleDelete = async (id: string) => {
    await deleteTrainerWorkout(id);
    setConfirmDelete(null);
    onWorkoutsChange();
  };

  // ── Assign handler ──────────────────────────────────────────────────────────

  const handleAssign = async () => {
    if (!assignModal || !selectedStudentId) return;
    setAssigning(true);
    setAssignError(null);
    try {
      await assignWorkoutToStudent({
        trainerId,
        studentId: selectedStudentId,
        trainerWorkoutId: assignModal.id,
        workoutName: assignModal.name,
        workouts: assignModal.workouts,
        trainerName,
      });
      setAssignSuccess(true);
      setTimeout(() => {
        setAssignModal(null);
        setAssignSuccess(false);
        setSelectedStudentId('');
      }, 1500);
    } catch (err: any) {
      setAssignError(err?.message ?? 'Erro ao atribuir treino.');
    } finally {
      setAssigning(false);
    }
  };

  // ── Builder screen ──────────────────────────────────────────────────────────

  if (showBuilder || editing) {
    return (
      <div className="p-5 pb-28">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => { setShowBuilder(false); setEditing(null); }}
            className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            ←
          </button>
          <div>
            <h1 className="text-xl font-black text-white">{editing ? 'Editar Programa' : 'Novo Programa'}</h1>
            <p className="text-gray-500 text-xs">Monte os dias e exercícios</p>
          </div>
        </div>
        <WorkoutBuilder
          trainerId={trainerId}
          trainerName={trainerName}
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowBuilder(false); setEditing(null); }}
        />
      </div>
    );
  }

  // ── Library screen ──────────────────────────────────────────────────────────

  return (
    <div className="p-5 space-y-5 pb-28 animate-fade-in">
      <div className="pt-1">
        <h1 className="text-2xl font-black text-white">Meus Programas</h1>
        <p className="text-gray-400 text-sm mt-0.5">Crie e atribua treinos aos seus alunos</p>
      </div>

      {/* Create button */}
      <button
        onClick={() => setShowBuilder(true)}
        className="w-full flex items-center gap-3 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 active:scale-95 transition-all rounded-2xl p-4"
      >
        <div className="w-10 h-10 bg-emerald-600/30 border border-emerald-500/40 rounded-xl flex items-center justify-center flex-shrink-0">
          <PlusCircleIcon className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="text-left">
          <p className="text-emerald-300 font-bold text-sm">Criar Novo Programa</p>
          <p className="text-emerald-700 text-xs">Monte do zero: dias, exercícios e cargas</p>
        </div>
      </button>

      {/* Empty state */}
      {workouts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-gray-800 p-5 rounded-full mb-4">
            <DumbbellIcon className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-white font-bold">Nenhum programa criado</p>
          <p className="text-gray-500 text-sm mt-1">Crie seu primeiro programa acima</p>
        </div>
      )}

      {/* Workout cards */}
      <div className="space-y-3">
        {workouts.map(tw => (
          <div key={tw.id} className="bg-gray-800/60 border border-gray-700/50 rounded-2xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DumbbellIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold leading-tight truncate">{tw.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {tw.workouts.length} dia{tw.workouts.length !== 1 ? 's' : ''} ·{' '}
                    {tw.workouts.reduce((acc, w) => acc + w.exercises.length, 0)} exercícios
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                {/* Assign */}
                <button
                  onClick={() => { setAssignModal(tw); setSelectedStudentId(''); setAssignError(null); setAssignSuccess(false); }}
                  disabled={students.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={students.length === 0 ? 'Você não tem alunos vinculados' : undefined}
                >
                  Atribuir a Aluno
                </button>
                {/* Edit */}
                <button
                  onClick={() => setEditing(tw)}
                  className="px-4 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-bold transition-colors active:scale-95"
                >
                  Editar
                </button>
                {/* Delete */}
                <button
                  onClick={() => setConfirmDelete(tw.id)}
                  className="px-3 py-2.5 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors active:scale-95"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Delete confirm */}
              {confirmDelete === tw.id && (
                <div className="mt-2.5 flex gap-2">
                  <button onClick={() => setConfirmDelete(null)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-600 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={() => handleDelete(tw.id)}
                    className="flex-1 py-2.5 rounded-xl bg-red-900/60 border border-red-700/50 text-red-300 text-sm font-semibold hover:bg-red-900 transition-colors">
                    Excluir
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Assign modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80" onClick={() => setAssignModal(null)}>
          <div className="bg-gray-900 border-t border-gray-700 rounded-t-3xl w-full max-w-md p-6 pb-10"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-white font-bold text-lg">Atribuir Programa</h3>
                <p className="text-gray-500 text-sm mt-0.5 truncate">{assignModal.name}</p>
              </div>
              <button onClick={() => setAssignModal(null)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white text-2xl rounded-xl hover:bg-gray-800 transition-colors">×</button>
            </div>

            {assignSuccess ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
                  <span className="text-3xl">✓</span>
                </div>
                <p className="text-emerald-400 font-bold">Treino atribuído com sucesso!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Selecionar Aluno</label>
                  <select
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="">Escolha um aluno...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.student_id}>{s.student_name}</option>
                    ))}
                  </select>
                </div>

                {assignError && (
                  <p className="text-red-400 text-sm bg-red-900/20 border border-red-700/30 rounded-xl px-3 py-2">{assignError}</p>
                )}

                <button
                  onClick={handleAssign}
                  disabled={!selectedStudentId || assigning}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {assigning ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Confirmar Atribuição'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
