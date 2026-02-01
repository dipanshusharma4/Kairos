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
  FaCheck
} from "react-icons/fa";
import { IoIosLogOut } from "react-icons/io";
import { signOut } from "next-auth/react";

export default function Dashboard() {
  const { data: session, status } = useSession();
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
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInData, setCheckInData] = useState({
    sleepHours: "",
    activityType: "Meditation",
    activityDuration: ""
  });

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
          // Revert if needed, but for now we expect success
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

    // Save Sleep if provided
    if (checkInData.sleepHours) {
      await fetch("/api/dashboard/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Sleep",
          duration: parseFloat(checkInData.sleepHours) * 60 // Convert hours to mins
        })
      });
    }

    // Save Activity if provided
    if (checkInData.activityDuration) {
      await fetch("/api/dashboard/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: checkInData.activityType,
          duration: parseInt(checkInData.activityDuration)
        })
      });
    }

    setIsCheckInOpen(false);
    setCheckInData({ sleepHours: "", activityType: "Meditation", activityDuration: "" });
    fetchStats(); // Refresh dashboard
  };

  if (status === "loading" || isLoading) {
    return <div className="h-screen flex items-center justify-center bg-[#a7ebf2] text-[#023859] font-bold text-xl">Loading your wellness space...</div>;
  }

  return (
    <div className="min-h-screen bg-[#a7ebf2] p-4 md:p-8 font-sans relative">

      {/* Check-in Modal Overlay */}
      {isCheckInOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#023859] rounded-xl shadow-2xl p-6 w-full max-w-md border border-[#a7ebf2]/20">
            <h3 className="text-2xl font-bold text-[#a7ebf2] mb-4">Daily Check-in</h3>
            <form onSubmit={handleCheckInSubmit} className="space-y-4">

              <div>
                <label className="block text-white text-sm mb-1">How many hours did you sleep?</label>
                <input
                  type="number"
                  step="0.5"
                  value={checkInData.sleepHours}
                  onChange={e => setCheckInData({ ...checkInData, sleepHours: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#a7ebf2]"
                  placeholder="e.g. 7.5"
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-1">Did you move or meditate?</label>
                <div className="flex gap-2">
                  <select
                    value={checkInData.activityType}
                    onChange={e => setCheckInData({ ...checkInData, activityType: e.target.value })}
                    className="bg-white/10 border border-white/20 rounded-lg p-2 text-white focus:outline-none flex-1"
                  >
                    <option value="Meditation" className="text-black">Meditation</option>
                    <option value="Walking" className="text-black">Walking</option>
                    <option value="Yoga" className="text-black">Yoga</option>
                    <option value="Workout" className="text-black">Workout</option>
                    <option value="Reading" className="text-black">Reading</option>
                  </select>
                  <input
                    type="number"
                    value={checkInData.activityDuration}
                    onChange={e => setCheckInData({ ...checkInData, activityDuration: e.target.value })}
                    className="w-24 bg-white/10 border border-white/20 rounded-lg p-2 text-white focus:outline-none"
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
      <header className="flex justify-between items-center mb-8 bg-[#023859] p-4 rounded-xl shadow-lg text-[#a7ebf2]">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer">
            <label htmlFor="avatar-upload" className="cursor-pointer">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#a7ebf2] bg-[#a7ebf2] flex items-center justify-center relative">
                {displayImage ? (
                  <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FaUser className="text-[#023859] text-xl" />
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
              <h1 className="text-xl font-bold">{greeting}, </h1>

              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-[#a7ebf2] font-bold focus:outline-none w-32"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                  />
                  <button onClick={handleNameSave} className="p-1 hover:bg-white/10 rounded text-green-400">
                    <FaCheck />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={startEditingName}>
                  <h1 className="text-xl font-bold border-b border-transparent group-hover:border-[#a7ebf2]/50 transition-colors">
                    {displayName || "Friend"}!
                  </h1>
                  <FaPen className="text-xs opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                </div>
              )}
            </div>

            <p className="text-sm opacity-80">Here is your wellness overview.</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <span className="hidden md:inline font-medium">Log Out</span>
          <IoIosLogOut className="text-xl" />
        </button>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Mood Tracker Card */}
        <div className="bg-[#023859] p-6 rounded-xl shadow-lg hover:transform hover:scale-[1.02] transition-all duration-300">
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
        <div className="bg-[#023859] p-6 rounded-xl shadow-lg hover:transform hover:scale-[1.02] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <FaChartLine className="text-[#a7ebf2] text-2xl" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Weekly Progress</h3>
          <p className="text-[#91d7df] text-sm mb-4">You've completed {stats.completedGoals} wellness acts!</p>
          <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
            <div className="bg-[#a7ebf2] h-2.5 rounded-full" style={{ width: `${stats.progress}%` }}></div>
          </div>
          <span className="text-xs text-[#a7ebf2]">{stats.progress}% to weekly goal</span>
        </div>

        {/* Sleep Tracker */}
        <div className="bg-[#023859] p-6 rounded-xl shadow-lg hover:transform hover:scale-[1.02] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-500/20 p-3 rounded-lg">
              <FaBed className="text-[#a7ebf2] text-2xl" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Sleep Quality</h3>
          <h4 className="text-3xl font-bold text-[#a7ebf2] mb-2">{stats.sleep}</h4>
          <p className="text-[#91d7df] text-sm">Average sleep avg (last 7 days).</p>
        </div>

        {/* Activity */}
        <div className="col-span-1 md:col-span-2 bg-[#004e75] p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center gap-3 mb-6">
            <FaWalking className="text-[#a7ebf2] text-2xl" />
            <h3 className="text-xl font-bold">Recent Activities</h3>
          </div>
          <div className="space-y-4">
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-[#023859] rounded-lg border border-white/5 hover:bg-[#022c45] transition-colors">
                  <div>
                    <p className="font-semibold text-[#a7ebf2]">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.time}</p>
                  </div>
                  <span className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full">{item.duration}</span>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm text-center py-4">No recent activities found early. Start a Check-in!</div>
            )}
          </div>
        </div>

        {/* Quick Review */}
        <div className="bg-[#023859] p-6 rounded-xl shadow-lg flex flex-col justify-center items-center text-center">
          <div className="bg-green-500/20 p-4 rounded-full mb-4">
            <FaCalendarCheck className="text-[#a7ebf2] text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Daily Check-in</h3>
          <p className="text-[#91d7df] text-sm mb-6">Have you taken a moment for yourself today?</p>
          <button
            onClick={() => setIsCheckInOpen(true)}
            className="bg-[#a7ebf2] text-[#023859] font-bold py-2 px-6 rounded-full hover:bg-white transition-colors w-full"
          >
            Start Check-in
          </button>
        </div>

      </div>
    </div>
  );
}
