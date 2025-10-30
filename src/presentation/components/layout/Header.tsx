"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Sun, Moon, User, Trophy, Users, BarChart3, LogOut } from "lucide-react";
import { useAuthStore } from "@/src/stores/authStore";

export function Header() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navigationItems = [
    { name: "หน้าแรก", href: "/", icon: null },
    { name: "ทัวร์นาเมนต์", href: "/tournaments", icon: Trophy },
    { name: "อันดับ", href: "/leaderboard", icon: BarChart3 },
    { name: "คอมมูนิตี้", href: "/community", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 backdrop-blur supports-[backdrop-filter]:bg-white/95 dark:supports-[backdrop-filter]:bg-gray-900/95">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-2 text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <span className="text-3xl">🃏</span>
              <span>Dummy Legends</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="rounded-lg p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            )}

            {/* User Menu - Authenticated */}
            {isAuthenticated && user ? (
              <div className="hidden md:block relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {user.displayName.charAt(0)}
                  </div>
                  <span>{user.displayName}</span>
                </button>
                
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 z-20 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          โปรไฟล์
                        </Link>
                        <Link
                          href="/profile/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          ตั้งค่า
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                            router.push("/");
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <LogOut className="h-4 w-4" />
                          ออกจากระบบ
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Auth Buttons - Desktop - Not Authenticated */
              <div className="hidden md:flex md:items-center md:space-x-2">
                <Link
                  href="/auth/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden rounded-lg p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-1 border-t border-gray-200 dark:border-gray-800">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeMobileMenu}
                className="flex items-center space-x-2 rounded-lg px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                <span>{item.name}</span>
              </Link>
            ))}
            <div className="pt-4 space-y-2 border-t border-gray-200 dark:border-gray-800">
              {isAuthenticated && user ? (
                <>
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-2 rounded-lg px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span>โปรไฟล์</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                      router.push("/");
                    }}
                    className="w-full flex items-center space-x-2 rounded-lg px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>ออกจากระบบ</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-2 rounded-lg px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span>เข้าสู่ระบบ</span>
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-base font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    สมัครสมาชิก
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
