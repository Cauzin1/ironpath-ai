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

  const handleSave = async (name: string, wkts: TrainerWorkout['workouts']) => {
    await saveTrainerWorkout({ id: editing?.id, trainer_id: trainerId, name, workouts: wkts });
    setShowBuilder(false);
    setEditing(null);
    onWorkoutsChange();
  };

  const handleDelete = async (id: string) => {
    await deleteTrainerWorkout(id);
    setConfirmDelete(null);
    onWorkoutsChange();
  };

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
      }, 1600);
    } catch (err: any) {
      setAssignError(err?.message ?? 'Erro ao atribuir treino.');
    } finally {
      setAssigning(false);
    }
  };

  // ── Builder screen ──
  if (showBuilder || editing) {
    return (
      <div className="px-4 pt-4 pb-28">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => { setShowBuilder(false); setEditing(null); }}
            className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-black text-white">{editing ? 'Editar Programa' : 'Novo Programa'}</h1>
            <p className="text-gray-600 text-xs">Monte os dias e exercícios</p>
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

  // ── Library screen ──
  return (
    <div className="px-4 pt-4 pb-28 space-y-4 animate-fade-in">

      {/* Create button */}
      <button
        onClick={() => setShowBuilder(true)}
        className="w-full flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/15 active:scale-95 transition-all rounded-2xl p-4"
      >
        <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-900/50">
          <PlusCircleIcon className="w-5 h-5 text-white" />
        </div>
        <div className="text-left flex-1">
          <p className="text-emerald-300 font-bold">Criar Novo Programa</p>
          <p className="text-emerald-800 text-xs">Monte dias, exercícios, cargas e descanso</p>
        </div>
        <span className="text-emerald-700 text-xl">›</span>
      </button>

      {/* Empty state */}
      {workouts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 text-4xl">
            🏋️
          </div>
          <p className="text-white font-bold text-lg">Nenhum programa ainda</p>
          <p className="text-gray-500 text-sm mt-1">Crie seu primeiro programa de treino acima</p>
        </div>
      )}

      {/* Workout cards */}
      {workouts.length > 0 && (
        <div className="space-y-3">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider px-1">
            {workouts.length} programa{workouts.length !== 1 ? 's' : ''}
          </p>
          {workouts.map(tw => {
            const totalExercises = tw.workouts.reduce((acc, w) => acc + w.exercises.length, 0);
            return (
              <div key={tw.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-4">
                  {/* Title row */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <DumbbellIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold leading-tight">{tw.name}</p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {tw.workouts.length} dia{tw.workouts.length !== 1 ? 's' : ''} · {totalExercises} exercício{totalExercises !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {/* Delete */}
                    <button
                      onClick={() => setConfirmDelete(confirmDelete === tw.id ? null : tw.id)}
                      className={`p-2 rounded-xl transition-colors flex-shrink-0 ${confirmDelete === tw.id ? 'bg-red-900/30 text-red-400' : 'text-gray-700 hover:text-red-400 hover:bg-red-900/20'}`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Day pills */}
                  {tw.workouts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {tw.workouts.map((w, i) => (
                        <span key={i} className="px-2.5 py-1 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-xs font-medium">
                          {w.name || `Dia ${i + 1}`}
                          <span className="text-gray-600 ml-1">· {w.exercises.length}ex</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Delete confirm */}
                  {confirmDelete === tw.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDelete(null)}
                        className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold hover:bg-gray-700 transition-colors">
                        Cancelar
                      </button>
                      <button onClick={() => handleDelete(tw.id)}
                        className="flex-1 py-2.5 rounded-xl bg-red-900/50 border border-red-700/40 text-red-300 text-sm font-semibold hover:bg-red-900/80 transition-colors">
                        Excluir programa
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setAssignModal(tw); setSelectedStudentId(''); setAssignError(null); setAssignSuccess(false); }}
                        disabled={students.length === 0}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={students.length === 0 ? 'Você não tem alunos vinculados' : undefined}
                      >
                        Atribuir a Aluno
                      </button>
                      <button
                        onClick={() => setEditing(tw)}
                        className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold transition-colors active:scale-95"
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={() => setAssignModal(null)}>
          <div
            className="bg-gray-900 border-t border-gray-800 rounded-t-3xl w-full max-w-md"
            style={{ maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-700 rounded-full" />
            </div>

            <div className="px-5 pb-10">
              <div className="flex items-center justify-between py-4">
                <div>
                  <h3 className="text-white font-bold text-lg">Atribuir Programa</h3>
                  <p className="text-gray-500 text-sm truncate max-w-[220px]">{assignModal.name}</p>
                </div>
                <button onClick={() => setAssignModal(null)}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-white text-2xl rounded-xl hover:bg-gray-800 transition-colors">×</button>
              </div>

              {assignSuccess ? (
                <div className="flex flex-col items-center py-10 gap-3">
                  <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-3xl">
                    ✅
                  </div>
                  <p className="text-emerald-400 font-bold text-lg">Treino atribuído!</p>
                  <p className="text-gray-500 text-sm">O aluno já pode ativar o programa</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Selecionar aluno</p>

                  {/* Custom student list */}
                  <div className="space-y-2">
                    {students.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudentId(selectedStudentId === s.student_id ? '' : s.student_id)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
                          selectedStudentId === s.student_id
                            ? 'bg-emerald-500/15 border-emerald-500/40'
                            : 'bg-gray-800/60 border-gray-700/50 hover:border-gray-600'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(s.student_name)} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-black">{s.student_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-white font-semibold flex-1 text-left">{s.student_name}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedStudentId === s.student_id
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-gray-600'
                        }`}>
                          {selectedStudentId === s.student_id && (
                            <span className="text-white text-xs font-black">✓</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {assignError && (
                    <p className="text-red-400 text-sm bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3">{assignError}</p>
                  )}

                  <button
                    onClick={handleAssign}
                    disabled={!selectedStudentId || assigning}
                    className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {assigning
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : 'Confirmar Atribuição'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
