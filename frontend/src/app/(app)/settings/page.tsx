"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Lock,
  LogOut,
  Loader2,
  Settings,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores";
import { usersApi, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Password form schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const [profileStatus, setProfileStatus] = useState<"idle" | "success" | "error">("idle");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "success" | "error">("idle");
  const [passwordMessage, setPasswordMessage] = useState("");

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setProfileStatus("idle");
    setProfileMessage("");

    try {
      const updatedUser = await usersApi.updateProfile({ name: data.name });
      setUser(updatedUser);
      setProfileStatus("success");
      setProfileMessage("Profile updated successfully");
    } catch (error) {
      setProfileStatus("error");
      if (error instanceof ApiError) {
        setProfileMessage(error.message);
      } else {
        setProfileMessage("Failed to update profile");
      }
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordStatus("idle");
    setPasswordMessage("");

    try {
      await usersApi.updatePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });
      setPasswordStatus("success");
      setPasswordMessage("Password updated successfully");
      passwordForm.reset();
    } catch (error) {
      setPasswordStatus("error");
      if (error instanceof ApiError) {
        setPasswordMessage(error.message);
      } else {
        setPasswordMessage("Failed to update password");
      }
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        <Separator />

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...profileForm.register("name")}
                  placeholder="Enter your name"
                />
                {profileForm.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              {profileStatus !== "idle" && (
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    profileStatus === "success" && "text-green-600",
                    profileStatus === "error" && "text-destructive"
                  )}
                >
                  {profileStatus === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {profileMessage}
                </div>
              )}

              <Button
                type="submit"
                disabled={profileForm.formState.isSubmitting}
              >
                {profileForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Password</CardTitle>
            </div>
            <CardDescription>
              Change your account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...passwordForm.register("currentPassword")}
                  placeholder="Enter current password"
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...passwordForm.register("newPassword")}
                  placeholder="Enter new password"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...passwordForm.register("confirmPassword")}
                  placeholder="Confirm new password"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {passwordStatus !== "idle" && (
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    passwordStatus === "success" && "text-green-600",
                    passwordStatus === "error" && "text-destructive"
                  )}
                >
                  {passwordStatus === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {passwordMessage}
                </div>
              )}

              <Button
                type="submit"
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Account</CardTitle>
            </div>
            <CardDescription>
              Manage your account session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sign out</p>
                  <p className="text-sm text-muted-foreground">
                    Sign out of your account on this device
                  </p>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>

              <Separator />

              <div className="text-xs text-muted-foreground">
                <p>Account created: {new Date(user.created_at).toLocaleDateString()}</p>
                <p>Last updated: {new Date(user.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
