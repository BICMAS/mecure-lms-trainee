import React, { useEffect, useState } from "react";
import { Lock, Mail, Phone, ArrowRight, EyeOff, Eye } from "lucide-react";
import { loginWithEmail, loginWithPhone } from "@/api/auth";
import { resolveTraineeDisplayName, saveAuth } from "@/utils/auth";

interface LoginPageProps {
  onLogin: (user: any) => void;
}

type LoginMode = "EMAIL" | "PHONE";

const SLIDER_IMAGES = [
  {
    src: "/img/slider/mecure-banner-1.jpg",
    alt: "MeCure Excellence Academy banner",
  },
  {
    src: "/img/slider/mecure-banner-2.jpg",
    alt: "MeCure learning experience",
  },
  {
    src: "/img/slider/mecure-banner-3.jpg",
    alt: "MeCure digital platform",
  },
] as const;

const SLIDER_INTERVAL_MS = 5000;

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loginMode, setLoginMode] = useState<LoginMode>("EMAIL");

  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);

  useEffect(() => {
    if (isSliderPaused || SLIDER_IMAGES.length <= 1) return;

    const id = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % SLIDER_IMAGES.length);
    }, SLIDER_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [isSliderPaused]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data =
        loginMode === "EMAIL"
          ? await loginWithEmail(email, password)
          : await loginWithPhone(phoneNumber, password);

      const userEmail = data.user?.email ?? "";
      const displayName = resolveTraineeDisplayName({
        fullName: data.user?.fullName,
        name: data.user?.name,
        email: userEmail,
        phoneNumber: data.user?.phoneNumber,
        phone: data.user?.phone,
      });
      const avatarSeed = userEmail || data.user?.id || displayName;
      const avatar = `https://api.dicebear.com/6.x/identicon/svg?seed=${encodeURIComponent(
        avatarSeed,
      )}`;

      saveAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
          id: data.user?.id ?? "",
          name: displayName,
          fullName: displayName,
          email: userEmail,
          role: "Trainee",
          avatar,
        },
      });
      onLogin({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface flex items-stretch justify-center">
      <div className="w-full grid md:grid-cols-2 min-h-screen md:min-h-[640px] md:my-0 md:rounded-none shadow-none md:shadow-xl overflow-hidden bg-white">
        {/* Brand panel / image slider */}
        <aside
          className="relative min-h-52 md:min-h-full overflow-hidden bg-brand-primary"
          onMouseEnter={() => setIsSliderPaused(true)}
          onMouseLeave={() => setIsSliderPaused(false)}
          aria-roledescription="carousel"
          aria-label="MeCure Academy highlights"
        >
          {SLIDER_IMAGES.map((image, index) => (
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
                index === slideIndex ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={index !== slideIndex}
            />
          ))}

          <div className="absolute inset-0 bg-linear-to-t from-brand-primary/55 via-brand-primary/15 to-transparent pointer-events-none" />

          <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-2 z-10">
            {SLIDER_IMAGES.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setSlideIndex(index)}
                aria-label={`Show slide ${index + 1}`}
                aria-current={index === slideIndex}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === slideIndex
                    ? "w-6 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </aside>

        {/* Form panel */}
        <div className="flex flex-col justify-center p-10 md:p-12 bg-white">
          <div className="mb-6 md:hidden text-center">
          <img
              src="/img/mecure-industries-logo.png"
              className="h-20 md:h-24 mx-auto"
              alt="MeCure Excellence Academy"
            />
            <h1 className="font-display text-xl md:text-3xl font-bold leading-none">
              MeCure Excellence Academy
            </h1>
            <p className="mt-2 text-brand-accent font-bold text-2xl md:text-base tracking-normal leading-none uppercase">
              Digital Platform
            </p>
          </div>
          <div className="hidden md:block mb-8 text-center">
            <img
              src="/img/mecure-industries-logo.png"
              className="h-16 md:h-24 mx-auto"
              alt="MeCure Excellence Academy"
            />
            <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight">
              MeCure Excellence Academy
            </h1>
            <p className="mt-2 text-brand-accent font-semibold text-sm md:text-base tracking-wide">
              Digital Platform
            </p>
          </div>

          <div className="flex bg-brand-surface rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginMode("EMAIL")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                loginMode === "EMAIL"
                  ? "bg-white shadow text-brand-grey"
                  : "text-slate-500"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("PHONE")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                loginMode === "PHONE"
                  ? "bg-white shadow text-brand-grey"
                  : "text-slate-500"
              }`}
            >
              Phone
            </button>
          </div>

          <form
            id="mecure-academy-login-form"
            name="login"
            method="post"
            autoComplete="on"
            className="space-y-5"
            onSubmit={handleSubmit}
          >
            {error && (
              <div className="bg-red-50 text-brand-error text-sm p-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {loginMode === "EMAIL" ? (
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-semibold text-brand-grey mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="login-phone"
                  className="block text-sm font-semibold text-brand-grey mb-2"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    id="login-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    placeholder="123-456-7890"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold text-brand-grey mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-70 transition-colors"
            >
              {isLoading ? "Signing in…" : "Sign In"}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
