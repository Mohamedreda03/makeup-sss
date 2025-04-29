import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UserCircle,
  Settings,
  LogOut,
  UserPlus,
  LogIn,
  Calendar,
} from "lucide-react";

// تعريف النوع للمستخدم مع خاصية role
interface CustomUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export function UserButton() {
  const { data: session, status } = useSession();
  // استخدام التعريف المخصص للمستخدم
  const user = session?.user as CustomUser;

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  if (status === "loading") {
    return (
      <Button variant="ghost" size="icon" disabled>
        <UserCircle className="h-6 w-6 text-pink-400" />
      </Button>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center space-x-2">
        <Link href="/sign-in">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-700 hover:text-pink-500"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="rounded-full" size="icon">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.image || undefined}
              alt={user.name || "User"}
            />
            <AvatarFallback className="bg-pink-100 text-pink-500">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link
              href="/admin"
              className="w-full cursor-pointer"
              prefetch={true}
            >
              <UserCircle className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        {user.role === "ARTIST" && (
          <DropdownMenuItem asChild>
            <Link href="/artist-dashboard" className="w-full cursor-pointer">
              <UserCircle className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/appointments" className="w-full cursor-pointer">
            <Calendar className="mr-2 h-4 w-4" />
            Appointments
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile" className="w-full cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full cursor-pointer text-red-500 hover:bg-red-50 hover:text-red-600 justify-start font-medium"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
