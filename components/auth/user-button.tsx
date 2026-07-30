import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import { LogOut, User as UserIcon } from "lucide-react";

export async function UserButton({ collapsed = false }: { collapsed?: boolean }) {
  const session = await auth();

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className={`flex items-center gap-2.5 rounded-xl transition-all hover:bg-elevated ${
          collapsed ? "h-10 w-10 mx-auto justify-center" : "p-2.5"
        }`}
      >
        <div className="h-8 w-8 rounded-full bg-elevated border border-border flex items-center justify-center text-muted shrink-0">
          <UserIcon className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="truncate">
            <p className="text-xs font-semibold text-soft truncate">Sign In</p>
            <p className="text-[10px] text-dim truncate">Google OAuth</p>
          </div>
        )}
      </Link>
    );
  }

  return (
    <div className={`flex items-center ${collapsed ? "flex-col gap-1.5" : "justify-between"}`}>
      <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="h-8 w-8 rounded-full border border-border shrink-0"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
            {session.user.name?.charAt(0) || "T"}
          </div>
        )}
        {!collapsed && (
          <div className="truncate">
            <p className="text-xs font-semibold text-soft truncate">{session.user.name || "Trader"}</p>
            <p className="text-[10px] text-dim truncate">{session.user.email}</p>
          </div>
        )}
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          title="Sign out"
          className="p-1.5 rounded-lg hover:bg-elevated text-dim hover:text-loss transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
