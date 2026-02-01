import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authoptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/db/connectDb";
import Mood from "@/models/Mood";
import Activity from "@/models/Activity";

export async function GET(request) {
    try {
        const session = await getServerSession(authoptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const userId = session.user.id;
        const now = new Date();

        // 1. Get Today's Mood
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todaysMood = await Mood.findOne({
            userId,
            createdAt: { $gte: startOfDay }
        }).sort({ createdAt: -1 });

        // 2. Get Weekly Activity Progress (Simple goal: 10 activities/week)
        // 2. Get Weekly Activity Chart Data
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start
        startOfWeek.setHours(0, 0, 0, 0);

        const weeklyActivities = await Activity.find({
            userId,
            date: { $gte: startOfWeek }
        });

        // Initialize 7 days with 0 minutes
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const weeklyData = days.map(day => ({ day, minutes: 0 }));

        weeklyActivities.forEach(activity => {
            const dayIndex = new Date(activity.date).getDay();
            weeklyData[dayIndex].minutes += activity.duration;
        });

        // Calculate progress based on Duration Goal (e.g. 150 mins / week recommended)
        const totalWeeklyMinutes = weeklyData.reduce((acc, d) => acc + d.minutes, 0);
        const weeklyGoalMinutes = 150;
        const progressPercentage = Math.min(Math.round((totalWeeklyMinutes / weeklyGoalMinutes) * 100), 100);

        // 3. Calculate Average Sleep (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const sleepLogs = await Activity.find({
            userId,
            type: 'Sleep',
            date: { $gte: sevenDaysAgo }
        });

        let avgSleepStr = "0h 0m";
        let sleepQuality = "Unknown";
        if (sleepLogs.length > 0) {
            const totalMinutes = sleepLogs.reduce((acc, log) => acc + log.duration, 0);
            const avgMinutes = totalMinutes / sleepLogs.length;
            const hours = Math.floor(avgMinutes / 60);
            const mins = Math.round(avgMinutes % 60);
            avgSleepStr = `${hours}h ${mins}m`;

            if (avgMinutes < 360) sleepQuality = "Needs Improvement";
            else if (avgMinutes < 420) sleepQuality = "Fair";
            else if (avgMinutes < 540) sleepQuality = "Good";
            else sleepQuality = "Excellent";
        }

        // 4. Recent Activities (All)
        const recentActivities = await Activity.find({ userId })
            .sort({ date: -1 });

        return NextResponse.json({
            mood: todaysMood ? todaysMood.mood : null,
            progress: progressPercentage,
            completedGoals: totalWeeklyMinutes, // Sending minutes instead of count
            weeklyData: weeklyData,
            sleep: avgSleepStr,
            sleepQuality: sleepQuality,
            recentActivities: recentActivities.map(a => {
                const dateObj = new Date(a.date);
                const isToday = dateObj.toDateString() === new Date().toDateString();
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

                return {
                    id: a._id,
                    title: a.type,
                    time: isToday ? timeStr : `${dateStr}, ${timeStr}`,
                    duration: a.duration >= 60 ? `${Math.floor(a.duration / 60)}h ${a.duration % 60}m` : `${a.duration} min`
                };
            })
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
