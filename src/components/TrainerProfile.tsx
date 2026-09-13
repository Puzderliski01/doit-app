import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface TrainerProfileProps {
  theme: 'dark' | 'light';
  trainerId: string;
  onBack: () => void;
}

const TRAINERS_DATA: Record<string, any> = {
  t3: {
    name: 'Chris Heria',
    title: 'High Intensity Fitness Trainer',
    avatar: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=400&fit=crop',
    about: 'Famous American calisthenics and pro bar athlete trainer. Chris Heria has 4.5 million YouTube subscribers, where he shares his knowledge and workout routines.',
    experience: '7 years',
    completed: 88,
    activeClients: 32,
    onlinePrograms: true,
    socialMedia: true,
  },
  default: {
    name: 'Trainer',
    title: 'Fitness Trainer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop',
    about: 'Professional fitness trainer with years of experience helping clients reach their goals.',
    experience: '5 years',
    completed: 50,
    activeClients: 20,
    onlinePrograms: true,
    socialMedia: false,
  },
};

export const TrainerProfile: React.FC<TrainerProfileProps> = ({
  theme,
  trainerId,
  onBack,
}) => {
  const isLight = theme === 'light';
  const trainer = TRAINERS_DATA[trainerId] || TRAINERS_DATA.default;

  return (
    <div className="space-y-0">
      {/* Hero Image */}
      <div className="relative h-56 -mx-4 -mt-4 overflow-hidden rounded-b-[24px]">
        <img 
          src={trainer.coverImage}
          alt={trainer.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Back button */}
        <button
          onClick={() => { haptic.lightTap(); onBack(); }}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Chat button */}
        <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-neon-400 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-[#0a0a0a]" />
        </button>
      </div>

      {/* Trainer Info */}
      <div className="text-center -mt-12 relative z-10 mb-4">
        <img 
          src={trainer.avatar}
          alt={trainer.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-neon-400 mx-auto"
        />
        <h1 className={`text-xl font-bold mt-3 ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
          {trainer.name}
        </h1>
        <p className={`text-sm ${isLight ? 'text-neon-600' : 'text-neon-400'}`}>
          {trainer.title}
        </p>
      </div>

      {/* About Section */}
      <div className="py-4">
        <h2 className={`text-sm font-bold mb-2 ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>About</h2>
        <p className={`text-sm leading-relaxed ${isLight ? 'text-[#666]' : 'text-white/50'}`}>
          {trainer.about}
        </p>
      </div>

      {/* Stats Row */}
      <div className={`flex items-center gap-4 py-4 border-t ${
        isLight ? 'border-[#f0f0f0]' : 'border-white/[0.06]'
      }`}>
        <div className="flex-1 text-center">
          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isLight ? 'text-[#aaa]' : 'text-white/40'}`}>
            Experience
          </p>
          <p className={`text-sm font-bold ${isLight ? 'text-neon-600' : 'text-neon-400'}`}>
            {trainer.experience}
          </p>
        </div>
        <div className={`w-px h-8 ${isLight ? 'bg-[#f0f0f0]' : 'bg-white/[0.06]'}`} />
        <div className="flex-1 text-center">
          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isLight ? 'text-[#aaa]' : 'text-white/40'}`}>
            Completed
          </p>
          <p className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
            {trainer.completed}
          </p>
        </div>
        <div className={`w-px h-8 ${isLight ? 'bg-[#f0f0f0]' : 'bg-white/[0.06]'}`} />
        <div className="flex-1 text-center">
          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isLight ? 'text-[#aaa]' : 'text-white/40'}`}>
            Active Clients
          </p>
          <p className={`text-sm font-bold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
            {trainer.activeClients}
          </p>
        </div>
      </div>

      {/* Online Programs */}
      {trainer.onlinePrograms && (
        <button className={`w-full flex items-center justify-between py-4 border-t cursor-pointer ${
          isLight ? 'border-[#f0f0f0]' : 'border-white/[0.06]'
        }`}>
          <span className={`text-sm font-semibold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
            Online Programs
          </span>
          <ChevronRight className={`w-4 h-4 ${isLight ? 'text-[#ccc]' : 'text-white/30'}`} />
        </button>
      )}

      {/* Social Media */}
      {trainer.socialMedia && (
        <button className={`w-full flex items-center justify-between py-4 border-t cursor-pointer ${
          isLight ? 'border-[#f0f0f0]' : 'border-white/[0.06]'
        }`}>
          <span className={`text-sm font-semibold ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
            Social Media
          </span>
          <ChevronRight className={`w-4 h-4 ${isLight ? 'text-[#ccc]' : 'text-white/30'}`} />
        </button>
      )}
    </div>
  );
};
