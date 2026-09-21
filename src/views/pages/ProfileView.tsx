import { useState } from 'react';
import { Card, Button, Modal } from '../components/ui';
import { StepTracker } from '../components/StepTracker';
import { WeightChart } from '../components/WeightChart';
import { BodyMeasurementsPanel } from '../components/BodyMeasurementsPanel';
import { AvatarPickerModal } from '../components/AvatarPickerModal';
import { useProfileController } from '../../controllers/useProfileController';
import { AuthUser, UserProfile } from '../../models/types/User';
import { Settings, Flame, Dumbbell, Scale, CheckCircle2, Circle, Camera } from 'lucide-react';

interface ProfileViewProps {
  user: AuthUser | null;
}

export function ProfileView({ user }: ProfileViewProps) {
  const {
    profile,
    editingField,
    tempValue,
    setTempValue,
    openEditModal,
    closeEditModal,
    saveEdit,
    updateAvatar,
    getSuggestedRange,
  } = useProfileController(user?.id);

  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  // Daily Habits checklist
  const [habits, setHabits] = useState([
    { id: 'water', label: '3L Hydration', done: true },
    { id: 'protein', label: 'Hit Daily Protein Target', done: true },
    { id: 'sleep', label: '7+ Hours Sleep', done: false },
    { id: 'workout', label: 'Complete Scheduled Workout', done: true },
    { id: 'steps', label: 'Reach Daily Step Goal', done: false },
  ]);

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h))
    );
  };

  const { min: suggestMin, max: suggestMax } = getSuggestedRange();
  const currentWeightNum = parseFloat(profile.currentWeight) || 78.5;
  const goalWeightNum = parseFloat(profile.goalWeight) || 75;
  const stepGoalNum = parseInt(profile.stepGoal, 10) || 8000;

  return (
    <div className="space-y-8 sm:space-y-10 animate-fade-in">
      {/* ─── Profile Header Card ────────────────────────────────────────────── */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Interactive Profile Avatar */}
            <div className="relative group flex-shrink-0">
              <div
                onClick={() => setAvatarModalOpen(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-neutral-500 overflow-hidden flex items-center justify-center shadow-md cursor-pointer transition-all relative"
                title="Click to change photo"
              >
                {profile.avatarUrl || user?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl || user?.avatarUrl}
                    alt={user?.username || 'Athlete'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}

                {/* Camera edit overlay - only visible on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                  <Camera size={18} className="text-white" />
                  <span className="text-[9px] font-mono-stat font-bold uppercase tracking-wider text-neutral-300">Edit</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                  {user?.username || 'Athlete'}
                </h2>
                <span className="px-2.5 py-0.5 rounded bg-red-950/60 border border-red-800/40 text-red-400 text-xs font-black uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 font-mono-stat">
                {user?.email || 'Local User'} · Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}
              </p>
              <button
                onClick={() => setAvatarModalOpen(true)}
                className="text-[11px] text-neutral-400 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1.5 cursor-pointer font-mono-stat transition-colors"
              >
                <Camera size={12} /> Change photo
              </button>
            </div>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={() => openEditModal('currentWeight')}
            className="w-full sm:w-auto"
          >
            <Settings size={16} /> Edit Metrics & Goals
          </Button>
        </div>
      </Card>

      {/* ─── Quick Stats Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5 sm:p-6 flex items-center gap-4 cursor-pointer hover:border-neutral-500 transition-all" onClick={() => openEditModal('currentWeight')}>
          <div className="p-3 rounded-lg bg-red-950/40 text-red-400 border border-red-800/30">
            <Scale size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Current Weight</p>
            <p className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono-stat mt-0.5">{profile.currentWeight} kg</p>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#18181b] text-neutral-300 border border-[#27272a]">
            <Flame size={20} className="text-[#ef4444]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Streak</p>
            <p className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono-stat mt-0.5">5 Days</p>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-950/40 text-red-400 border border-red-800/30">
            <Dumbbell size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Total Workouts</p>
            <p className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono-stat mt-0.5">14 Sessions</p>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 flex items-center gap-4 cursor-pointer hover:border-neutral-500 transition-all" onClick={() => openEditModal('nutrition')}>
          <div className="p-3 rounded-lg bg-[#18181b] text-neutral-300 border border-[#27272a]">
            <span className="text-base font-black text-[#ef4444]">CAL</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Daily Calories</p>
            <p className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono-stat mt-0.5">{profile.nutrition} kcal</p>
          </div>
        </Card>
      </div>

      {/* ─── Two-Column Desktop Section ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Weight Progression Chart */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <Card className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-4 bg-[#dc2626] rounded-sm" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Bodyweight Progression</h3>
              </div>
              <div className="text-right">
                <span className="text-xs sm:text-sm font-bold text-neutral-400">Target: </span>
                <span className="text-xs sm:text-sm font-black text-[#ef4444] font-mono-stat">{profile.goalWeight} kg</span>
              </div>
            </div>
            <WeightChart currentWeight={currentWeightNum} goalWeight={goalWeightNum} height={250} />
          </Card>

          {/* Daily Step Tracker */}
          <StepTracker stepGoal={stepGoalNum} />
        </div>

        {/* Right Column: Daily Habits & Bio Details */}
        <div className="space-y-6 sm:space-y-8">
          {/* Daily Habits Checklist */}
          <Card className="p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-2 h-4 bg-[#dc2626] rounded-sm" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Daily Habits</h3>
            </div>

            <div className="space-y-2.5">
              {habits.map((habit) => (
                <button
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id)}
                  className={`w-full flex items-center gap-3.5 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                    habit.done
                      ? 'bg-red-950/20 border-red-900/40 text-white'
                      : 'bg-[#18181b] border-[#27272a] text-neutral-400 hover:text-white'
                  }`}
                >
                  {habit.done ? (
                    <CheckCircle2 size={18} className="text-[#ef4444] flex-shrink-0" />
                  ) : (
                    <Circle size={18} className="text-neutral-600 flex-shrink-0" />
                  )}
                  <span className={`text-xs sm:text-sm font-bold ${habit.done ? 'line-through text-neutral-400' : ''}`}>
                    {habit.label}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Biological Metrics Summary */}
          <Card className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-2 h-4 bg-[#dc2626] rounded-sm" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Body Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-3.5 text-xs font-mono-stat">
              <div className="p-3.5 rounded-lg bg-[#18181b] border border-[#27272a]">
                <p className="text-neutral-400 font-bold text-[10px] uppercase">Height</p>
                <p className="text-white font-black text-base mt-1">{profile.height} cm</p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#18181b] border border-[#27272a]">
                <p className="text-neutral-400 font-bold text-[10px] uppercase">Age</p>
                <p className="text-white font-black text-base mt-1">{profile.age} yrs</p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#18181b] border border-[#27272a]">
                <p className="text-neutral-400 font-bold text-[10px] uppercase">Sex</p>
                <p className="text-white font-black text-base mt-1">{profile.gender}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#18181b] border border-[#27272a]">
                <p className="text-neutral-400 font-bold text-[10px] uppercase">Daily Steps</p>
                <p className="text-white font-black text-base mt-1">{profile.stepGoal}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Body Circumference & Adonis V-Taper Index (/api/measurements) ──── */}
      <BodyMeasurementsPanel />

      {/* ─── Profile / Goal Edit Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={editingField !== null}
        onClose={closeEditModal}
        title="Update Athlete Parameters"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-400 mb-2">
              Select Variable
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['currentWeight', 'goalWeight', 'height', 'age', 'nutrition', 'stepGoal', 'gender'] as (keyof UserProfile)[]).map((field) => (
                <button
                  key={field}
                  onClick={() => openEditModal(field)}
                  className={`px-3 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all text-left cursor-pointer ${
                    editingField === field
                      ? 'bg-[#dc2626] text-white'
                      : 'bg-[#18181b] text-neutral-400 hover:text-white border border-[#27272a]'
                  }`}
                >
                  {field.replace(/([A-Z])/g, ' $1')}
                </button>
              ))}
            </div>
          </div>

          {editingField && (
            <div className="pt-3 border-t border-[#27272a]">
              <label className="block text-xs font-black text-white uppercase tracking-wider mb-2">
                Edit {editingField.replace(/([A-Z])/g, ' $1')}
              </label>

              {editingField === 'gender' ? (
                <div className="flex gap-2">
                  {(['Male', 'Female'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setTempValue(g)}
                      className={`flex-1 py-2.5 rounded-lg font-black uppercase tracking-wider text-xs cursor-pointer ${
                        tempValue === g ? 'bg-[#dc2626] text-white' : 'bg-[#18181b] text-neutral-400 border border-[#27272a]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              ) : editingField === 'nutrition' ? (
                <div className="space-y-2">
                  <div className="text-center font-black text-2xl text-white font-mono-stat">
                    {tempValue || '2400'} kcal
                  </div>
                  <input
                    type="range"
                    min="1200"
                    max="4500"
                    step="50"
                    value={tempValue || 2400}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-full accent-[#dc2626]"
                  />
                </div>
              ) : editingField === 'stepGoal' ? (
                <div className="space-y-2">
                  <div className="text-center font-black text-2xl text-white font-mono-stat">
                    {Number(tempValue || 8000).toLocaleString()} steps
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="20000"
                    step="500"
                    value={tempValue || 8000}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-full accent-[#dc2626]"
                  />
                </div>
              ) : (
                <div>
                  <input
                    type="number"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-full bg-black/60 border border-[#27272a] rounded-lg px-4 py-2 text-base font-bold text-white focus:outline-none focus:border-[#dc2626] font-mono-stat"
                    placeholder="Enter value"
                  />
                  {(editingField === 'currentWeight' || editingField === 'goalWeight') && (
                    <p className="text-[11px] text-neutral-400 mt-2">
                      Healthy range for {profile.height} cm: <span className="text-white font-bold">{suggestMin}kg – {suggestMax}kg</span>
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2.5 mt-5">
                <Button variant="secondary" className="flex-1" onClick={closeEditModal}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    if (editingField) saveEdit(editingField, tempValue);
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Avatar / Profile Picture Picker Modal */}
      <AvatarPickerModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentAvatar={profile.avatarUrl || user?.avatarUrl}
        username={user?.username || 'Athlete'}
        onSaveAvatar={updateAvatar}
      />
    </div>
  );
}
