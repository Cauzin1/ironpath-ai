import { supabase } from '../supaBaseClient';
import { TrainerStudent, TrainerWorkout, AssignedWorkout, TrainerInvite, Workout } from '../types';

// ─── Invite Codes ─────────────────────────────────────────────────────────────

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(): string {
  return Array.from({ length: 6 }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join('');
}

export const generateInviteCode = async (
  trainerId: string,
  trainerName: string
): Promise<string> => {
  // Try up to 5 times to find a unique code
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const { error } = await supabase.from('trainer_invites').upsert(
      { trainer_id: trainerId, trainer_name: trainerName, code },
      { onConflict: 'trainer_id' }
    );
    if (!error) return code;
  }
  throw new Error('Não foi possível gerar um código. Tente novamente.');
};

export const getMyInviteCode = async (trainerId: string): Promise<TrainerInvite | null> => {
  const { data, error } = await supabase
    .from('trainer_invites')
    .select('*')
    .eq('trainer_id', trainerId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
};

// ─── Students ─────────────────────────────────────────────────────────────────

export const getMyStudents = async (trainerId: string): Promise<TrainerStudent[]> => {
  const { data, error } = await supabase
    .from('trainer_students')
    .select('*')
    .eq('trainer_id', trainerId)
    .order('joined_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const removeStudent = async (relationId: string): Promise<void> => {
  const { error } = await supabase
    .from('trainer_students')
    .delete()
    .eq('id', relationId);
  if (error) throw error;
};

export const joinByInviteCode = async (
  code: string,
  studentId: string,
  studentName: string
): Promise<{ trainerName: string }> => {
  const { data: invite, error: lookupErr } = await supabase
    .from('trainer_invites')
    .select('trainer_id, trainer_name')
    .eq('code', code.toUpperCase().trim())
    .single();

  if (lookupErr || !invite) throw new Error('Código inválido. Verifique e tente novamente.');

  const { error: joinErr } = await supabase.from('trainer_students').insert({
    trainer_id: invite.trainer_id,
    student_id: studentId,
    student_name: studentName,
    trainer_name: invite.trainer_name,
  });

  if (joinErr) {
    if (joinErr.code === '23505') throw new Error('Você já está vinculado a este professor.');
    throw joinErr;
  }

  return { trainerName: invite.trainer_name };
};

export const getMyTrainer = async (studentId: string): Promise<TrainerStudent | null> => {
  const { data, error } = await supabase
    .from('trainer_students')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
};

export const leaveTrainer = async (studentId: string): Promise<void> => {
  const { error } = await supabase
    .from('trainer_students')
    .delete()
    .eq('student_id', studentId);
  if (error) throw error;
};

// ─── Trainer Workout Templates ────────────────────────────────────────────────

export const getTrainerWorkouts = async (trainerId: string): Promise<TrainerWorkout[]> => {
  const { data, error } = await supabase
    .from('trainer_workouts')
    .select('*')
    .eq('trainer_id', trainerId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const saveTrainerWorkout = async (
  tw: Omit<TrainerWorkout, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<TrainerWorkout> => {
  const payload = {
    trainer_id: tw.trainer_id,
    name: tw.name,
    workouts: tw.workouts,
    updated_at: new Date().toISOString(),
    ...(tw.id ? { id: tw.id } : {}),
  };
  const { data, error } = await supabase
    .from('trainer_workouts')
    .upsert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteTrainerWorkout = async (id: string): Promise<void> => {
  const { error } = await supabase.from('trainer_workouts').delete().eq('id', id);
  if (error) throw error;
};

// ─── Assignments ──────────────────────────────────────────────────────────────

export const assignWorkoutToStudent = async (params: {
  trainerId: string;
  studentId: string;
  trainerWorkoutId: string;
  workoutName: string;
  workouts: Workout[];
  trainerName: string;
}): Promise<void> => {
  // Reset exercise state for student (clean start)
  const freshWorkouts: Workout[] = params.workouts.map(w => ({
    ...w,
    lastPerformedDate: undefined,
    exercises: w.exercises.map(e => ({
      ...e,
      completedSets: [],
      isFinished: false,
      rpe: undefined,
      history: [],
    })),
  }));

  const { error } = await supabase.from('assigned_workouts').insert({
    trainer_id: params.trainerId,
    student_id: params.studentId,
    trainer_workout_id: params.trainerWorkoutId,
    workout_name: params.workoutName,
    workouts: freshWorkouts,
    trainer_name: params.trainerName,
    is_active: false,
  });
  if (error) throw error;
};

export const getAssignedWorkoutsForStudent = async (
  studentId: string
): Promise<AssignedWorkout[]> => {
  const { data, error } = await supabase
    .from('assigned_workouts')
    .select('*')
    .eq('student_id', studentId)
    .order('assigned_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const activateAssignedWorkout = async (
  assignment: AssignedWorkout,
  userId: string,
  currentCompletedDates: string[]
): Promise<void> => {
  // 1. Mark assignment as active
  const { error: updateErr } = await supabase
    .from('assigned_workouts')
    .update({ is_active: true, activated_at: new Date().toISOString() })
    .eq('id', assignment.id);
  if (updateErr) throw updateErr;

  // 2. Copy workouts into student's user_progress (preserve completed_dates)
  const { error: progressErr } = await supabase.from('user_progress').upsert({
    user_id: userId,
    workouts: assignment.workouts,
    completed_dates: currentCompletedDates,
    current_workout_index: 0,
    updated_at: new Date().toISOString(),
  });
  if (progressErr) throw progressErr;
};
