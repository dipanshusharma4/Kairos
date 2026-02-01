"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaUser,
  FaChartLine,
  FaCalendarCheck,
  FaClock,
  FaSmile,
  FaUtensils,
  FaBed,
  FaWalking,
  FaPen,
  FaCheck,
  FaTrash,
  FaEdit
} from "react-icons/fa";
import { IoIosLogOut } from "react-icons/io";
import { signOut } from "next-auth/react";

export default function Dashboard() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [greeting, setGreeting] = useState("");

  // Name Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [displayImage, setDisplayImage] = useState(""); // Stores URL or Base64

  // Stats State
  const [stats, setStats] = useState({
    mood: null,
    progress: 0,
    completedGoals: 0,
    sleep: "0h 0m",
    sleepQuality: "Unknown",
    sleepQuality: "Unknown",
    recentActivities: [],
    weeklyData: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInData, setCheckInData] = useState({
    activityType: "Meditation",
    activityDuration: "",
    customActivityType: ""
  });
  const [isCustomActivity, setIsCustomActivity] = useState(false);

  const [isSleepLoggingOpen, setIsSleepLoggingOpen] = useState(false);
  const [sleepInput, setSleepInput] = useState("");

  // Edit Activity State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ id: null, type: "", duration: "" });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    // Initialize display name/image from session
    if (session?.user) {
      if (session.user.name) setDisplayName(session.user.name);
      if (session.user.image) setDisplayImage(session.user.image);
    }
  }, [status, router, session]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    if (status === "authenticated") fetchStats();
  }, [status]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameSave = async () => {
    if (!tempName.trim()) {
      setIsEditingName(false);
      return;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: tempName })
      });

      if (res.ok) {
        const data = await res.json();
        setDisplayName(data.username);
        // Update local session to reflect changes in Navbar immediately
        await update({ name: data.username });
      }
    } catch (error) {
      console.error("Failed to update name", error);
    } finally {
      setIsEditingName(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit size to prevent payload issues (e.g. 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;

      // Optimistic Update
      setDisplayImage(base64String);

      try {
        const res = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64String })
        });

        if (!res.ok) {
          console.error("Failed request");
        } else {
          // Update local session
          await update({ image: base64String });
        }
      } catch (error) {
        console.error("Failed to upload image", error);
        alert("Failed to upload image.");
      }
    };
    reader.readAsDataURL(file);
  };

  const startEditingName = () => {
    setTempName(displayName || session?.user?.name || "");
    setIsEditingName(true);
  };

  const handleSleepLogSubmit = async () => {
    if (!sleepInput || parseFloat(sleepInput) < 0) return;

    try {
      await fetch("/api/dashboard/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Sleep",
          duration: parseFloat(sleepInput) * 60
        })
      });
      setSleepInput("");
      setIsSleepLoggingOpen(false);
      fetchStats();
    } catch (error) {
      console.error("Failed to log sleep");
    }
  };

  const handleMoodSave = async (mood) => {
    // Optimistic updatte
    setStats(prev => ({ ...prev, mood }));

    try {
      await fetch("/api/dashboard/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood })
      });
    } catch (error) {
      console.error("Failed to save mood");
    }
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();



    // Save Activity if provided
    if (checkInData.activityDuration && parseInt(checkInData.activityDuration) >= 0) {
      const type = isCustomActivity ? checkInData.customActivityType : checkInData.activityType;

      if (type) {
        await fetch("/api/dashboard/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: type,
            duration: parseInt(checkInData.activityDuration)
          })
        });
      }
    }

    setIsCheckInOpen(false);
    setCheckInData({ activityType: "Meditation", activityDuration: "", customActivityType: "" });
    setIsCustomActivity(false);
    fetchStats(); // Refresh dashboard
  };

  const handleDeleteActivity = async (id) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    try {
      const res = await fetch(`/api/dashboard/activity/${id}`, { method: "DELETE" });
      if (res.ok) fetchStats();
    } catch (error) {
      console.error("Failed to delete activity", error);
    }
  };

  const openEditModal = (activity) => {
    // Extract numeric duration
    const durationMatch = activity.duration.match(/(\d+)/);
    const durationVal = durationMatch ? durationMatch[0] : "";

    setEditData({
      id: activity.id,
      type: activity.title,
      duration: durationVal // Approximation if mixed format, but usually we send minutes back or handle it. 
      // Note: Endpoint sends formatted string, so we might need to rely on what we have or handle parsing better.
      // Actually the endpoint sends formatted string. Best to user raw duration from backend, but we didn't add it.
      // Let's assume user just re-enters it or we parse simple "15 min" or "1h 30m".
      // For now, let's just let them type new duration.
    });
    // Re-parsing logic for UI convenience:
    let mins = 0;
    if (activity.duration.includes('h')) {
      const parts = activity.duration.split(' ');
      const h = parseInt(parts[0]) || 0;
      const m = parseInt(parts[1]) || 0;
      mins = h * 60 + m;
    } else {
      mins = parseInt(activity.duration) || 0;
    }
    setEditData({ id: activity.id, type: activity.title, duration: mins });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`/api/dashboard/activity/${editData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editData.type,
          duration: parseInt(editData.duration)
        })
      });
      setIsEditModalOpen(false);
      fetchStats();
    } catch (error) {
      console.error("Failed to edit activity", error);
    }
  };

  if (status === "loading" || isLoading) {
    return <div className="h-screen flex items-center justify-center bg-[#a7ebf2] text-[#023859] font-bold text-xl">Loading your wellness space...</div>;
  }

  return (
    <div className="w-full bg-gradient-to-br from-[#a7ebf2] via-[#86dae3] to-[#60c0ce] p-4 md:p-8 pb-10 font-sans relative overflow-x-hidden">

      {/* Edit Activity Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#023859] rounded-xl shadow-2xl p-6 w-full max-w-md border border-[#a7ebf2]/20">
            <h3 className="text-xl font-bold text-[#a7ebf2] mb-4">Edit Activity</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm mb-1">Activity Type</label>
                <input
                  type="text"
                  value={editData.type}
                  onChange={e => setEditData({ ...editData, type: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white text-sm mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={editData.duration}
                  onChange={e => setEditData({ ...editData, duration: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white focus:outline-none"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[#a7ebf2] text-[#023859] font-bold hover:bg-white transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-in Modal Overlay */}
      {isCheckInOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#023859] rounded-xl shadow-2xl p-6 w-full max-w-md border border-[#a7ebf2]/20">
            <h3 className="text-2xl font-bold text-[#a7ebf2] mb-4">Daily Check-in</h3>
            <form onSubmit={handleCheckInSubmit} className="space-y-4">



              <div>
                <label className="block text-white text-sm mb-1">Did something meaningful today?</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-2">
                    <select
                      value={isCustomActivity ? "Other" : checkInData.activityType}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === "Other") {
                          setIsCustomActivity(true);
                          setCheckInData({ ...checkInData, activityType: "" });
                        } else {
                          setIsCustomActivity(false);
                          setCheckInData({ ...checkInData, activityType: val });
                        }
                      }}
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white focus:outline-none"
                    >
                      <option value="Meditation" className="text-black">Meditation</option>
                      <option value="Walking" className="text-black">Walking</option>
                      <option value="Yoga" className="text-black">Yoga</option>
                      <option value="Workout" className="text-black">Workout</option>
                      <option value="Reading" className="text-black">Reading</option>
                      <option value="Other" className="text-black">Other (Type own)</option>
                    </select>

                    {isCustomActivity && (
                      <input
                        type="text"
                        placeholder="Type activity name..."
                        value={checkInData.customActivityType}
                        onChange={(e) => setCheckInData({ ...checkInData, customActivityType: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white focus:outline-none"
                      />
                    )}
                  </div>

                  <input
                    type="number"
                    min="0"
                    value={checkInData.activityDuration}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || parseFloat(val) >= 0) {
                        setCheckInData({ ...checkInData, activityDuration: val });
                      }
                    }}
                    className="w-24 h-[42px] bg-white/10 border border-white/20 rounded-lg p-2 text-white focus:outline-none"
                    placeholder="Mins"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCheckInOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[#a7ebf2] text-[#023859] font-bold hover:bg-white transition-colors"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center mb-8 bg-[#023859]/90 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/10 text-[#a7ebf2] animate-fadeIn">
        <div className="flex items-center gap-5">
          <div className="relative group cursor-pointer">
            <label htmlFor="avatar-upload" className="cursor-pointer">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#a7ebf2] shadow-[0_0_10px_rgba(167,235,242,0.3)] bg-[#a7ebf2] flex items-center justify-center relative transition-transform transform group-hover:scale-105">
                {displayImage ? (
                  <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FaUser className="text-[#023859] text-2xl" />
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FaPen className="text-white text-xs" />
                </div>
              </div>
            </label>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#a7ebf2] to-white drop-shadow-sm">{greeting}, </h1>

              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-[#a7ebf2] font-bold focus:outline-none w-40 backdrop-blur-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                  />
                  <button onClick={handleNameSave} className="p-1 hover:bg-white/10 rounded-full text-green-400 transition-colors">
                    <FaCheck />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={startEditingName}>
                  <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[#a7ebf2] border-b border-transparent group-hover:border-[#a7ebf2]/50 transition-all">
                    {displayName || "Friend"}!
                  </h1>
                  <FaPen className="text-xs opacity-0 group-hover:opacity-100 transition-opacity text-[#a7ebf2]" />
                </div>
              )}
            </div>

            <p className="text-sm text-[#a7ebf2]/80 font-medium">Here is your wellness overview.</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-5 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-300 border border-transparent hover:border-white/10 group"
        >
          <span className="hidden md:inline font-medium group-hover:text-white transition-colors">Log Out</span>
          <IoIosLogOut className="text-xl group-hover:scale-110 transition-transform" />
        </button>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Mood Tracker Card */}
        {/* Mood Tracker Card */}
        {/* Mood Tracker Card */}
        {/* Mood Tracker Card */}
        <div className="bg-[#023859]/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col animate-slideUp delay-100 group">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <FaSmile className="text-[#a7ebf2] text-2xl" />
            </div>
            <span className="text-xs font-semibold bg-[#a7ebf2] text-[#023859] px-2 py-1 rounded">Daily</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Mood Tracker</h3>
          <p className="text-[#91d7df] text-sm mb-4">
            {stats.mood ? `You're feeling ${stats.mood} today!` : "How are you feeling today?"}
          </p>
          <div className="flex justify-between gap-2 mt-2">
            {['😢', '😐', '🙂', '😄', '🤩'].map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => handleMoodSave(emoji)}
                className={`text-2xl hover:bg-white/10 p-2 rounded-full transition-colors ${stats.mood === emoji ? 'bg-white/20 scale-125' : ''}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Progress Card */}
        {/* Progress Card */}
        {/* Progress Card */}
        {/* Progress Card */}
        <div className="bg-[#023859]/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col animate-slideUp delay-200">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <FaChartLine className="text-[#a7ebf2] text-2xl" />
            </div>
            <span className="text-xs font-semibold bg-[#a7ebf2] text-[#023859] px-2 py-1 rounded">
              {stats.progress > 100 ? 100 : stats.progress}% Goal
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Weekly Activity</h3>
          <p className="text-[#91d7df] text-sm mb-4">
            {stats.completedGoals ? `${Math.floor(stats.completedGoals / 60)}h ${stats.completedGoals % 60}m` : '0m'} total this week
          </p>

          <div className="flex items-end justify-between gap-1 h-28 w-full mt-auto">
            {stats.weeklyData && stats.weeklyData.length > 0 ? (
              stats.weeklyData.map((d, i) => {
                const maxVal = Math.max(...stats.weeklyData.map(item => item.minutes), 60);
                const heightPercentage = Math.max((d.minutes / maxVal) * 100, 4); // Min 4% height for visibility

                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 bg-white text-[#023859] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold pointer-events-none z-10 shadow-lg">
                      {d.minutes} mins
                    </div>

                    <div
                      className={`w-full max-w-[14px] md:max-w-[24px] rounded-t-md transition-all duration-700 ease-out ${d.minutes > 0 ? 'bg-gradient-to-t from-[#a7ebf2] to-[#60c0ce] hover:to-white' : 'bg-white/5'}`}
                      style={{ height: `${heightPercentage}%` }}
                    ></div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">{d.day}</span>
                  </div>
                )
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs animate-pulse">Loading chart...</div>
            )}
          </div>
        </div>

        {/* Sleep Tracker */}
        {/* Sleep Tracker */}
        {/* Sleep Tracker */}
        {/* Sleep Tracker */}
        <div className="bg-[#023859]/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col animate-slideUp delay-300">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-500/20 p-3 rounded-lg">
              <FaBed className="text-[#a7ebf2] text-2xl" />
            </div>
            <button
              onClick={() => setIsSleepLoggingOpen(!isSleepLoggingOpen)}
              className="text-xs font-semibold bg-[#a7ebf2] text-[#023859] px-2 py-1 rounded hover:bg-white transition-colors"
            >
              {isSleepLoggingOpen ? "Close" : "Log Sleep"}
            </button>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Sleep Quality</h3>

          {isSleepLoggingOpen ? (
            <div className="mt-2 mb-2 animate-fadeIn">
              <label className="text-xs text-[#91d7df]">Hours last night:</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={sleepInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || parseFloat(val) >= 0) setSleepInput(val);
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-1 text-white text-sm focus:outline-none"
                />
                <button
                  onClick={handleSleepLogSubmit}
                  className="bg-[#a7ebf2] text-[#023859] px-3 py-1 rounded-lg text-sm font-bold hover:bg-white"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <h4 className="text-3xl font-bold text-[#a7ebf2] mb-1">{stats.sleep}</h4>
              <p className={`text-sm font-bold mb-1 ${stats.sleepQuality === 'Good' || stats.sleepQuality === 'Excellent' ? 'text-green-400' :
                stats.sleepQuality === 'Fair' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                {stats.sleepQuality}
              </p>
              <p className="text-[#91d7df] text-sm">Average sleep avg (last 7 days).</p>
            </>
          )}
        </div>

        {/* Activity */}
        {/* Activity */}
        {/* Activity */}
        {/* Activity */}
        <div className="col-span-1 md:col-span-2 bg-[#004e75]/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/10 text-white h-full flex flex-col animate-slideUp delay-300 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <FaWalking className="text-[#a7ebf2] text-2xl" />
            <h3 className="text-xl font-bold">Recent Activities</h3>
          </div>
          <div className="space-y-4 h-[140px] overflow-y-auto pr-2 custom-scrollbar">
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-[#023859]/80 rounded-xl border border-white/5 hover:bg-[#023859] hover:border-[#a7ebf2]/30 transition-all duration-200 group">
                  <div>
                    <p className="font-semibold text-[#a7ebf2]">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.time}</p>
                  </div>
                  <span className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full">{item.duration}</span>
                  <div className="flex gap-2 ml-3">
                    <button onClick={() => openEditModal(item)} className="text-gray-400 hover:text-white transition-colors"><FaEdit /></button>
                    <button onClick={() => handleDeleteActivity(item.id)} className="text-gray-400 hover:text-red-400 transition-colors"><FaTrash /></button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm text-center py-4">No recent activities found early. Start a Check-in!</div>
            )}
          </div>
        </div>

        {/* Quick Review */}
        {/* Quick Review */}
        {/* Quick Review */}
        <div className="bg-[#023859]/90 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/10 flex flex-col items-center text-center h-full relative overflow-hidden group animate-slideUp delay-300 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#a7ebf2]/5 rounded-full -mr-12 -mt-12 blur-xl transition-all group-hover:bg-[#a7ebf2]/10"></div>

          <div className="flex flex-col items-center justify-center flex-1 z-10 w-full">
            <div className="bg-gradient-to-br from-green-400/20 to-blue-500/20 p-4 rounded-full mb-3 border border-white/5 shadow-[0_0_15px_rgba(167,235,242,0.1)]">
              <FaCalendarCheck className="text-[#a7ebf2] text-3xl drop-shadow-md" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Daily Check-in</h3>
            <p className="text-[#91d7df] text-xs mb-4 max-w-[240px] leading-relaxed">
              Track your mood, activities, and sleep.
            </p>
          </div>

          <button
            onClick={() => setIsCheckInOpen(true)}
            className="bg-[#a7ebf2] text-[#023859] font-bold py-2 px-6 rounded-full text-sm hover:bg-white hover:scale-105 transition-all w-full shadow-lg relative z-10"
          >
            Start Check-in
          </button>
        </div>

      </div>
    </div>
  );
}
