import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Database, Trash2, RefreshCw, CheckCircle2, XCircle, Info } from "lucide-react";
import { checkDemoData, getDemoDataStats, seedDemoData, cleanupDemoData } from "@/utils/seedDemoData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ADMIN_EMAIL = "hello@krishraja.com";

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<{
    demoProfileCount: number;
    demoTaskCount: number;
    hasDemoData: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  // Check admin access
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Check demo data on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setChecking(true);
    setError(null);
    try {
      const statsData = await getDemoDataStats();
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load stats";
      setError(errorMessage);
      console.error("Error loading stats:", err);
    } finally {
      setChecking(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    try {
      toast.info("Starting seed process...", { description: "This may take a few minutes" });
      const result = await seedDemoData(200, false);
      
      toast.success("Demo data seeded successfully!", {
        description: `Created ${result.profilesCreated} profiles and ${result.tasksCreated} tasks`,
      });

      // Reload stats
      await loadStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to seed demo data";
      setError(errorMessage);
      toast.error("Failed to seed demo data", { description: errorMessage });
      console.error("Error seeding:", err);
    } finally {
      setSeeding(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm("Are you sure you want to delete all demo data? This cannot be undone.")) {
      return;
    }

    setCleaning(true);
    setError(null);
    try {
      toast.info("Cleaning up demo data...");
      const result = await cleanupDemoData();
      
      toast.success("Demo data cleaned up", {
        description: `Deleted ${result.deleted} demo profiles`,
      });

      // Reload stats
      await loadStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cleanup demo data";
      setError(errorMessage);
      toast.error("Failed to cleanup demo data", { description: errorMessage });
      console.error("Error cleaning up:", err);
    } finally {
      setCleaning(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Checking access...</span>
        </div>
      </div>
    );
  }

  // Check admin access - must be authenticated and have admin email
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              {!user 
                ? "You must be logged in to access this page."
                : "This page is restricted to administrators only."}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-2">
            {!user ? (
              <Button onClick={() => navigate("/auth")} className="w-full">
                Go to Login
              </Button>
            ) : (
              <Button onClick={() => navigate("/app")} className="w-full">
                Back to App
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Tools</h1>
            <p className="text-muted-foreground mt-1">Demo Data Management</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/app")}>
            Back to App
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Demo Data System</AlertTitle>
          <AlertDescription>
            This tool allows you to seed demo profiles and tasks for testing. 
            Demo data includes ~200 profiles split between Sydney and New York, 
            each with 0-3 tasks (roughly 200-300 tasks total).
          </AlertDescription>
        </Alert>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Demo Data</CardTitle>
                <CardDescription>Statistics about existing demo data</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={loadStats}
                disabled={checking}
              >
                <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {checking ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Demo Profiles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {stats.hasDemoData ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-2xl font-bold">{stats.demoProfileCount}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Open Demo Tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{stats.demoTaskCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Failed to load stats
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Seed or cleanup demo data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                onClick={handleSeed}
                disabled={seeding || cleaning}
                className="w-full"
                size="lg"
              >
                {seeding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Seed Demo Data (200 profiles)
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Creates ~200 demo profiles (100 Sydney, 100 New York) with 0-3 tasks each
              </p>
            </div>

            {stats?.hasDemoData && (
              <div className="space-y-2">
                <Button
                  onClick={handleCleanup}
                  disabled={seeding || cleaning}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  {cleaning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cleanup Demo Data
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Permanently deletes all demo profiles and their tasks
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Demo profiles are created with <code className="bg-muted px-1 rounded">is_demo = true</code>
            </p>
            <p>
              • Tasks are assigned coordinates based on neighbourhood data from the <code className="bg-muted px-1 rounded">neighbourhoods</code> table
            </p>
            <p>
              • The FeedScreen toggle controls visibility of demo tasks (default: shown)
            </p>
            <p>
              • RPC functions <code className="bg-muted px-1 rounded">get_nearby_tasks</code> and <code className="bg-muted px-1 rounded">get_public_tasks</code> include demo users
            </p>
            <p>
              • Tasks will only appear if your profile's neighbourhood matches the demo data city
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

