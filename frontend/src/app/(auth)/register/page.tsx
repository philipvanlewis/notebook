"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores";
import { authApi, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError("Please meet all password requirements");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Register the user
      await authApi.register({ email, password, name: name || undefined });

      // Step 2: Login to get token
      const tokenResponse = await authApi.login(email, password);

      // Step 3: Store token temporarily
      const { setToken } = useAuthStore.getState();
      setToken(tokenResponse.access_token);

      // Step 4: Fetch user profile
      const user = await authApi.me();

      // Step 5: Complete login
      login(user, tokenResponse.access_token);
      router.push("/notes");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Registration failed");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-none lg:border lg:shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Enter your details to get started
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            {/* Password requirements */}
            {password.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <PasswordCheck label="8+ characters" met={passwordChecks.length} />
                <PasswordCheck label="Uppercase" met={passwordChecks.uppercase} />
                <PasswordCheck label="Lowercase" met={passwordChecks.lowercase} />
                <PasswordCheck label="Number" met={passwordChecks.number} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={isLoading}
            />
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                {passwordsMatch ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">Passwords match</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">Passwords don&apos;t match</span>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isPasswordValid || !passwordsMatch}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>

          <p className="text-xs text-center text-muted-foreground">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

function PasswordCheck({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <X className="h-3 w-3 text-muted-foreground" />
      )}
      <span className={cn(met ? "text-green-500" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );
}
