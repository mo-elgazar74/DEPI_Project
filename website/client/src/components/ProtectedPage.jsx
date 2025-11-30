import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState, useMemo } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays, isSameDay, subDays } from "date-fns";
import { BarChart, Flame, BookOpen, MessageSquare } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/edubot/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/edubot/ui/avatar";
import { Button } from "@/components/edubot/ui/button";
import { Separator } from "@/components/edubot/ui/separator";
import { Badge } from "@/components/edubot/ui/badge";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function ProtectedPage() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Loading dashboard data...");
  const [profile, setProfile] = useState(null);
  const [chats, setChats] = useState([]);
  const [stats, setStats] = useState({
    questionsThisWeek: 0,
    studyStreak: 0,
    topSubject: "General",
    topSubjectPercentage: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoaded) {
        return;
      }
      if (!user) {
        navigate("/signin", { replace: true });
        return;
      }
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Missing session token");
        }

        const profileRes = await fetch(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileRes.ok) {
          const { profile: profileData } = await profileRes.json();
          if (!profileData?.birthday || !profileData?.grade || !profileData?.role) {
            navigate("/onboarding", { replace: true });
            return;
          }
          setProfile(profileData);
        } else if (profileRes.status === 401) {
          navigate("/signin", { replace: true });
          return;
        } else {
          const payload = await profileRes.json().catch(() => ({}));
          throw new Error(payload?.error || "Unable to load profile");
        }

        const protectedRes = await fetch(`${API_BASE}/api/protected`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!protectedRes.ok) {
          const payload = await protectedRes.json().catch(() => ({}));
          throw new Error(payload?.error || "Unable to fetch protected data.");
        }
        const data = await protectedRes.json();
        setMessage(data.message);

        // Fetch Chat History
        const chatsRes = await fetch(`${API_BASE}/api/rag/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (chatsRes.ok) {
          const chatsData = await chatsRes.json();
          const loadedChats = chatsData.chats || [];
          setChats(loadedChats);

          // Calculate Stats
          const now = new Date();
          const oneWeekAgo = subDays(now, 7);
          
          // 1. Questions this week (using chats as proxy)
          const recentChats = loadedChats.filter(chat => 
            new Date(chat.created_at) >= oneWeekAgo
          );
          const questionsCount = recentChats.length;

          // 2. Study Streak
          // Group chats by date
          const activityDates = new Set(
            loadedChats.map(chat => format(new Date(chat.created_at), "yyyy-MM-dd"))
          );
          
          let streak = 0;
          let checkDate = now;
          // Check today
          if (activityDates.has(format(checkDate, "yyyy-MM-dd"))) {
            streak++;
          }
          // Check previous days
          for (let i = 1; i < 365; i++) {
            checkDate = subDays(now, i);
            if (activityDates.has(format(checkDate, "yyyy-MM-dd"))) {
              streak++;
            } else {
              break;
            }
          }

          // 3. Top Subject
          const subjects = {
            "Math": 0, "Physics": 0, "Chemistry": 0, "Biology": 0, 
            "History": 0, "Geography": 0, "English": 0, "Arabic": 0,
            "Science": 0, "Programming": 0
          };
          
          loadedChats.forEach(chat => {
            const title = (chat.title || "").toLowerCase();
            if (title.includes("math") || title.includes("calc") || title.includes("algebra")) subjects["Math"]++;
            else if (title.includes("physic") || title.includes("newton") || title.includes("force")) subjects["Physics"]++;
            else if (title.includes("chem") || title.includes("atom") || title.includes("reaction")) subjects["Chemistry"]++;
            else if (title.includes("bio") || title.includes("cell") || title.includes("dna")) subjects["Biology"]++;
            else if (title.includes("hist") || title.includes("war") || title.includes("ancient")) subjects["History"]++;
            else if (title.includes("geo") || title.includes("earth") || title.includes("map")) subjects["Geography"]++;
            else if (title.includes("english") || title.includes("grammar")) subjects["English"]++;
            else if (title.includes("arabic")) subjects["Arabic"]++;
            else if (title.includes("code") || title.includes("program") || title.includes("python") || title.includes("java")) subjects["Programming"]++;
            else subjects["Science"]++; // Default fallback bucket if vaguely scientific, otherwise ignored in specific counts
          });

          let topSub = "General";
          let maxCount = 0;
          let totalCategorized = 0;

          Object.entries(subjects).forEach(([sub, count]) => {
            if (count > 0) totalCategorized += count;
            if (count > maxCount) {
              maxCount = count;
              topSub = sub;
            }
          });

          const percentage = totalCategorized > 0 ? Math.round((maxCount / totalCategorized) * 100) : 0;

          setStats({
            questionsThisWeek: questionsCount,
            studyStreak: streak,
            topSubject: topSub,
            topSubjectPercentage: percentage > 0 ? percentage : 0
          });
        }

        setStatus("");
      } catch (err) {
        setStatus(err.message || "Something went wrong.");
      }
    };

    fetchData();
  }, [API_BASE, getToken, isLoaded, navigate, user]);

  const createdAt = useMemo(() => {
    if (!user) return "";
    try {
      return format(new Date(user.createdAt), "PPP");
    } catch (error) {
      return new Date(user.createdAt).toLocaleDateString();
    }
  }, [user]);

  if (!isLoaded || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const primaryEmail = user.primaryEmailAddress?.emailAddress || "No email";
  const userInitials = (user.firstName?.[0] || user.username?.[0] || "U").toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.firstName || "User"}!</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/home")}>
              Home
            </Button>
            <Button variant="outline" onClick={() => navigate("/edubot")}>
              EduBot
            </Button>
            <Button onClick={() => navigate("/profile")}>Edit Profile</Button>
          </div>
        </div>

        {status && (
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-4 text-blue-700">{status}</CardContent>
          </Card>
        )}

        {profile && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-2 border-white shadow-sm">
                    <AvatarImage src={user.imageUrl} />
                    <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{user.fullName}</h3>
                    <p className="text-sm text-muted-foreground">{primaryEmail}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary">User since {createdAt}</Badge>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User ID</span>
                    <span className="font-mono text-xs">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Sign In</span>
                    <span>{user.lastSignInAt ? format(new Date(user.lastSignInAt), "PP p") : "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Role</p>
                    <p className="text-lg font-semibold capitalize">{profile.role}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Grade</p>
                    <p className="text-lg font-semibold capitalize">
                      {String(profile.grade).replace("g", "Grade ")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Birthday</p>
                    <p className="text-lg font-semibold">{profile.birthday}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Birth Year</p>
                    <p className="text-lg font-semibold">{profile.birthYear}</p>
                  </div>
                </div>
                
                {message && (
                  <div className="mt-6 rounded-lg bg-muted p-4">
                    <p className="text-sm font-medium mb-1">System Message:</p>
                    <p className="text-sm text-muted-foreground">{message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Learning Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  Your Learning Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-full">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium">Chats this week</span>
                    </div>
                    <span className="text-lg font-bold">{stats.questionsThisWeek}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 rounded-full">
                        <Flame className="h-4 w-4 text-orange-500" />
                      </div>
                      <span className="text-sm font-medium">Study streak</span>
                    </div>
                    <span className="text-lg font-bold">{stats.studyStreak} days 🔥</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-full">
                        <BookOpen className="h-4 w-4 text-green-500" />
                      </div>
                      <span className="text-sm font-medium">Top subject</span>
                    </div>
                    <span className="text-lg font-bold">
                      {stats.topSubject} {stats.topSubjectPercentage > 0 && `(${stats.topSubjectPercentage}%)`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Chats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Recent Chats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {chats.length > 0 ? (
                    chats.slice(0, 5).map((chat) => (
                      <div 
                        key={chat.id || chat.chat_id} 
                        className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border"
                        onClick={() => navigate(`/edubot?chatId=${chat.id || chat.chat_id}`)}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{chat.title || "Untitled Chat"}</span>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {format(new Date(chat.created_at), "MMM d")}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No chats yet. Start learning!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
