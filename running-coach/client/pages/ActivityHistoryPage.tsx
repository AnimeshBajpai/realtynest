import { useEffect, useState } from 'react';
import { Activity, Clock, Gauge, Calendar, Zap, Pencil, Trash2, Check, X, ChevronDown } from 'lucide-react';
import { useActivityStore } from '../store/activityStore';
import { useRunnerAuthStore } from '../store/runnerAuthStore';
import RunnerNav from '../components/RunnerNav';
import '../styles/running-coach.css';

export default function ActivityHistoryPage() {
  const { history, isLoading, fetchHistory, updateActivity, deleteActivity } = useActivityStore();
  const { getMe } = useRunnerAuthStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ distanceKm: '', durationMinutes: '', effortLevel: 5, notes: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleFilter = () => {
    fetchHistory({ startDate: startDate || undefined, endDate: endDate || undefined });
  };

  const startEdit = (activity: any) => {
    setEditingId(activity.id);
    setEditForm({
      distanceKm: String(activity.distanceKm),
      durationMinutes: String(activity.durationMinutes),
      effortLevel: activity.effortLevel || 5,
      notes: activity.notes || '',
    });
    setExpandedId(activity.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ distanceKm: '', durationMinutes: '', effortLevel: 5, notes: '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateActivity(editingId, {
        distanceKm: parseFloat(editForm.distanceKm),
        durationMinutes: parseFloat(editForm.durationMinutes),
        effortLevel: editForm.effortLevel,
        notes: editForm.notes || undefined,
      });
      setEditingId(null);
    } catch { /* handled by store */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteActivity(id);
      await getMe();
      setDeleteConfirmId(null);
    } catch { /* handled by store */ }
  };

  const formatPace = (mins: number) => {
    const m = Math.floor(mins);
    const s = Math.round((mins - m) * 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-5">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 pt-2">
          <Activity className="text-[#00D4FF]" size={24} />
          Activity History
        </h1>

        {/* Date filter */}
        <div className="bg-[#1E1E2E] border border-white/[0.05] rounded-xl p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs text-[#B0B0B0] mb-1">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00FF88] focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-[#B0B0B0] mb-1">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00FF88] focus:outline-none"
              />
            </div>
            <button
              onClick={handleFilter}
              className="bg-[#00FF88] text-black font-bold px-4 py-2 rounded-lg text-sm"
            >
              Filter
            </button>
          </div>
        </div>

        {/* Activity list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#1E1E2E] h-24 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="mx-auto text-white/20 mb-3" size={48} />
            <p className="text-[#B0B0B0]">No activities yet. Go for a run!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((activity) => {
              const date = new Date(activity.date || activity.createdAt);
              const formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              });
              const isExpanded = expandedId === activity.id;
              const isEditing = editingId === activity.id;
              const isDeleting = deleteConfirmId === activity.id;
              const pace = activity.avgPaceMinPerKm || activity.paceMinPerKm || 0;

              return (
                <div key={activity.id} className="bg-[#1E1E2E] border border-white/[0.05] rounded-xl overflow-hidden">
                  {/* Main row */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : activity.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#B0B0B0] flex items-center gap-1.5">
                        <Calendar size={13} /> {formattedDate}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#00FF88] font-bold flex items-center gap-1">
                          <Zap size={13} /> +{activity.xpEarned} XP
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-[#B0B0B0] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-[#B0B0B0] flex items-center gap-1">
                          <Activity size={11} /> Distance
                        </div>
                        <div className="text-lg font-bold text-white">{activity.distanceKm} km</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#B0B0B0] flex items-center gap-1">
                          <Clock size={11} /> Duration
                        </div>
                        <div className="text-lg font-bold text-white">{activity.durationMinutes} min</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#B0B0B0] flex items-center gap-1">
                          <Gauge size={11} /> Pace
                        </div>
                        <div className="text-lg font-bold text-[#00D4FF]">{formatPace(pace)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded section */}
                  {isExpanded && !isEditing && (
                    <div className="border-t border-white/[0.05] px-4 py-3">
                      {activity.notes && (
                        <p className="text-xs text-[#B0B0B0] italic mb-3">"{activity.notes}"</p>
                      )}
                      {activity.effortLevel && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-[#B0B0B0]">Effort:</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 10 }, (_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-1.5 rounded-full ${
                                  i < activity.effortLevel
                                    ? activity.effortLevel >= 8 ? 'bg-[#FF6B35]' : activity.effortLevel >= 5 ? 'bg-[#FFD93D]' : 'bg-[#00FF88]'
                                    : 'bg-white/10'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-white font-bold">{activity.effortLevel}/10</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(activity); }}
                          className="flex items-center gap-1.5 text-xs text-[#00D4FF] bg-[#00D4FF]/10 px-3 py-1.5 rounded-lg hover:bg-[#00D4FF]/20 transition-colors"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(activity.id); }}
                          className="flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 px-3 py-1.5 rounded-lg hover:bg-red-400/20 transition-colors"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>

                      {isDeleting && (
                        <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <p className="text-xs text-red-400 mb-2">Delete this activity? XP will be deducted.</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(activity.id)}
                              className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg font-bold"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-xs text-[#B0B0B0] px-3 py-1 rounded-lg border border-white/10"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edit form */}
                  {isEditing && (
                    <div className="border-t border-white/[0.05] px-4 py-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-[#B0B0B0] mb-1">Distance (km)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.distanceKm}
                            onChange={(e) => setEditForm({ ...editForm, distanceKm: e.target.value })}
                            className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00FF88] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#B0B0B0] mb-1">Duration (min)</label>
                          <input
                            type="number"
                            step="1"
                            value={editForm.durationMinutes}
                            onChange={(e) => setEditForm({ ...editForm, durationMinutes: e.target.value })}
                            className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00FF88] focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-[#B0B0B0] mb-1">
                          Effort: <span className="text-white font-bold">{editForm.effortLevel}/10</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={editForm.effortLevel}
                          onChange={(e) => setEditForm({ ...editForm, effortLevel: parseInt(e.target.value) })}
                          className="w-full accent-[#00FF88]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#B0B0B0] mb-1">Notes</label>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          rows={2}
                          className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00FF88] focus:outline-none resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="flex items-center gap-1.5 text-sm bg-[#00FF88] text-black font-bold px-4 py-2 rounded-lg"
                        >
                          <Check size={14} /> Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1.5 text-sm text-[#B0B0B0] px-4 py-2 rounded-lg border border-white/10"
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RunnerNav />
    </div>
  );
}
