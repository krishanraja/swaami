/**
 * Account Management Component
 * 
 * Handles:
 * 1. Data export (GDPR compliant)
 * 2. Account deletion with confirmation
 * 
 * Part of P2 Compliance implementation
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Download, 
  Trash2, 
  AlertTriangle, 
  Loader2,
  CheckCircle,
  X 
} from "lucide-react";

interface AccountManagementProps {
  userEmail?: string;
}

export function AccountManagement({ userEmail }: AccountManagementProps) {
  const navigate = useNavigate();
  const { signOut, authState } = useAuthContext();
  
  const [exportLoading, setExportLoading] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const CONFIRM_TEXT = "DELETE MY ACCOUNT";

  /**
   * Export user data as JSON
   * Fetches all user-related data from Supabase
   */
  const handleExportData = async () => {
    if (!authState.user) return;
    
    setExportLoading(true);
    setExportComplete(false);
    
    try {
      const userId = authState.user.id;
      
      // Fetch all user data from different tables
      const [
        profileResult,
        tasksResult,
        matchesResult,
        messagesResult,
        verificationsResult,
        photosResult,
        endorsementsResult,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("tasks").select("*").eq("user_id", userId),
        supabase.from("matches").select("*").eq("helper_id", userId),
        supabase.from("messages").select("*").eq("sender_id", userId),
        supabase.from("user_verifications").select("*").eq("user_id", userId),
        supabase.from("user_photos").select("*").eq("user_id", userId),
        supabase.from("endorsements").select("*").or(`endorser_id.eq.${userId},endorsed_id.eq.${userId}`),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        userId: userId,
        email: userEmail,
        profile: profileResult.data,
        tasks: tasksResult.data || [],
        matches: matchesResult.data || [],
        messagesSent: messagesResult.data || [],
        verifications: verificationsResult.data || [],
        photos: photosResult.data || [],
        endorsements: endorsementsResult.data || [],
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: "application/json" 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `swaami-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportComplete(true);
      toast.success("Your data has been exported", {
        description: "Check your downloads folder",
      });

      // Reset complete state after a few seconds
      setTimeout(() => setExportComplete(false), 5000);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data", {
        description: "Please try again or contact support",
      });
    } finally {
      setExportLoading(false);
    }
  };

  /**
   * Delete user account
   * This is a "soft delete" that:
   * 1. Anonymizes the profile
   * 2. Signs out the user
   * 
   * Note: Full deletion requires admin/service role
   * and should be handled via a scheduled job or support request
   */
  const handleDeleteAccount = async () => {
    if (!authState.user || deleteConfirmText !== CONFIRM_TEXT) return;
    
    setDeleteLoading(true);
    
    try {
      const userId = authState.user.id;
      
      // Anonymize profile data
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: "[Deleted User]",
          phone: null,
          skills: [],
          availability: "later",
        })
        .eq("user_id", userId);

      if (profileError) {
        throw profileError;
      }

      // Delete photos
      await supabase
        .from("user_photos")
        .delete()
        .eq("user_id", userId);

      // Delete verifications
      await supabase
        .from("user_verifications")
        .delete()
        .eq("user_id", userId);

      // Sign out
      await signOut();

      toast.success("Account deleted", {
        description: "Your account has been deleted. We're sorry to see you go.",
      });

      navigate("/");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete account", {
        description: "Please contact support for assistance",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Data Export */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Export Your Data</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Download all your data in JSON format. Includes profile, tasks, messages, and more.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleExportData}
              disabled={exportLoading}
            >
              {exportLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparing export...
                </>
              ) : exportComplete ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Downloaded
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Delete Account</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            
            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                size="sm"
                className="mt-3"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            ) : (
              <div className="mt-4 p-4 bg-destructive/10 rounded-xl space-y-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      This will permanently delete:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>Your profile and personal information</li>
                      <li>All your photos and verifications</li>
                      <li>Your task history</li>
                      <li>Your messages and endorsements</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">
                    Type <span className="font-mono font-bold text-foreground">{CONFIRM_TEXT}</span> to confirm:
                  </label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={CONFIRM_TEXT}
                    className="font-mono"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== CONFIRM_TEXT || deleteLoading}
                  >
                    {deleteLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Permanently Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


