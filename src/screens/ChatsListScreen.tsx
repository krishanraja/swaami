import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useMatches } from "@/hooks/useMatches";
import { useProfile } from "@/hooks/useProfile";

export function ChatsListScreen() {
  const navigate = useNavigate();
  const { matches, loading } = useMatches();
  const { profile } = useProfile();

  const activeMatches = matches.filter(
    (m) => m.status !== "cancelled" && m.task
  );

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    accepted: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    arrived: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    completed: "bg-accent/10 text-accent",
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <AppHeader title="Chats" />

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-muted rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : activeMatches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No chats yet</h3>
            <p className="text-muted-foreground text-sm">
              When you help someone or get help, you'll see your conversations here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeMatches.map((match) => {
              const isHelper = match.helper_id === profile?.id;
              const otherPerson = isHelper ? match.task?.owner : match.helper;

              return (
                <button
                  key={match.id}
                  onClick={() => navigate(`/chat/${match.id}`)}
                  className="w-full p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {otherPerson?.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium text-foreground truncate">
                          {otherPerson?.display_name || "Unknown"}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            statusColors[match.status] || "bg-muted text-muted-foreground"
                          }`}
                        >
                          {match.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {match.task?.title}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
