import React from 'react';
import { UserProfile } from '../types';
import { UserIcon } from './icons';

interface ProfileTabProps {
  profile: UserProfile;
  email?: string;
  onLogout: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ profile, email, onLogout }) => {
  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <div className="flex flex-col items-center mt-8">
        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-700 shadow-2xl mb-4">
            <UserIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Meu Perfil</h2>
        <p className="text-gray-500 text-sm">{email}</p>
      </div>

      <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-4 space-y-4">
        <div className="flex justify-between border-b border-gray-700 pb-2">
            <span className="text-gray-400">Idade</span>
            <span className="text-white font-bold">{profile.age} anos</span>
        </div>
        <div className="flex justify-between border-b border-gray-700 pb-2">
            <span className="text-gray-400">Peso</span>
            <span className="text-white font-bold">{profile.weight} kg</span>
        </div>
        <div className="flex justify-between border-b border-gray-700 pb-2">
            <span className="text-gray-400">Altura</span>
            <span className="text-white font-bold">{profile.height} cm</span>
        </div>
        <div className="flex justify-between">
            <span className="text-gray-400">Objetivo</span>
            <span className="text-white font-bold capitalize">{profile.goal}</span>
        </div>
      </div>

      <button 
        onClick={onLogout}
        className="w-full bg-red-900/20 border border-red-900/50 text-red-400 font-bold py-4 rounded-xl hover:bg-red-900/40 transition-colors"
      >
        Sair da Conta
      </button>
    </div>
  );
};