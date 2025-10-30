"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/src/stores/authStore";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";

export function RegisterView() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    username?: string;
    displayName?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: string;
  }>({});

  const validateForm = () => {
    const errors: typeof validationErrors = {};

    // Email validation
    if (!formData.email) {
      errors.email = "กรุณากรอกอีเมล";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    // Username validation
    if (!formData.username) {
      errors.username = "กรุณากรอกชื่อผู้ใช้";
    } else if (formData.username.length < 3) {
      errors.username = "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = "ชื่อผู้ใช้สามารถใช้ได้เฉพาะตัวอักษร ตัวเลข และ _";
    }

    // Display name validation
    if (!formData.displayName) {
      errors.displayName = "กรุณากรอกชื่อที่แสดง";
    } else if (formData.displayName.length < 2) {
      errors.displayName = "ชื่อที่แสดงต้องมีอย่างน้อย 2 ตัวอักษร";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "กรุณากรอกรหัสผ่าน";
    } else if (formData.password.length < 8) {
      errors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = "รหัสผ่านต้องประกอบด้วยตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลข";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    }

    // Terms acceptance validation
    if (!formData.acceptTerms) {
      errors.acceptTerms = "กรุณายอมรับข้อกำหนดการใช้งาน";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);
      router.push("/"); // Redirect to home page after successful registration
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const labels = ["", "อ่อนแอ", "ปานกลาง", "แข็งแรง", "แข็งแรงมาก"];
    const colors = ["", "text-red-600", "text-yellow-600", "text-green-600", "text-green-700"];

    return { strength, label: labels[Math.min(strength, 4)], color: colors[Math.min(strength, 4)] };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <span className="text-5xl">🃏</span>
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            สมัครสมาชิก
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            สร้างบัญชีเพื่อเริ่มเล่น Dummy Legends
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-2xl">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                อีเมล
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    validationErrors.email
                      ? "border-red-300 dark:border-red-700"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-colors`}
                  placeholder="your@email.com"
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    validationErrors.username
                      ? "border-red-300 dark:border-red-700"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-colors`}
                  placeholder="username123"
                />
              </div>
              {validationErrors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.username}
                </p>
              )}
            </div>

            {/* Display Name Field */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                ชื่อที่แสดง
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange("displayName", e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    validationErrors.displayName
                      ? "border-red-300 dark:border-red-700"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-colors`}
                  placeholder="ชื่อที่จะแสดงในเกม"
                />
              </div>
              {validationErrors.displayName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.displayName}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`block w-full pl-10 pr-10 py-3 border ${
                    validationErrors.password
                      ? "border-red-300 dark:border-red-700"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-colors`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.password}
                </p>
              )}
              {formData.password && passwordStrength.strength > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          level <= passwordStrength.strength
                            ? passwordStrength.strength <= 2
                              ? "bg-red-500"
                              : passwordStrength.strength === 3
                              ? "bg-yellow-500"
                              : "bg-green-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength.color}`}>
                    ความแข็งแรง: {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={`block w-full pl-10 pr-10 py-3 border ${
                    validationErrors.confirmPassword
                      ? "border-red-300 dark:border-red-700"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-colors`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms & Conditions */}
            <div>
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange("acceptTerms", e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="acceptTerms" className="text-sm text-gray-700 dark:text-gray-300">
                    ฉันยอมรับ{" "}
                    <Link
                      href="/terms"
                      className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
                      target="_blank"
                    >
                      ข้อกำหนดการใช้งาน
                    </Link>{" "}
                    และ{" "}
                    <Link
                      href="/privacy"
                      className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
                      target="_blank"
                    >
                      นโยบายความเป็นส่วนตัว
                    </Link>
                  </label>
                  {validationErrors.acceptTerms && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {validationErrors.acceptTerms}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>กำลังสมัครสมาชิก...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>สมัครสมาชิก</span>
                </div>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              มีบัญชีอยู่แล้ว?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            ← กลับหน้าแรก
          </Link>
        </div>
      </div>
    </div>
  );
}
