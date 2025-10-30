"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/src/stores/authStore";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

export function ForgotPasswordView() {
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();

  const validateEmail = () => {
    if (!email) {
      setValidationError("กรุณากรอกอีเมล");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError("รูปแบบอีเมลไม่ถูกต้อง");
      return false;
    }
    setValidationError(undefined);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateEmail()) {
      return;
    }

    try {
      await forgotPassword({ email });
      setIsSubmitted(true);
    } catch (error) {
      console.error("Forgot password error:", error);
    }
  };

  // Success State
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <span className="text-5xl">🃏</span>
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                ส่งอีเมลสำเร็จ!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยัง
              </p>
              <p className="text-blue-600 dark:text-blue-400 font-medium mb-6">{email}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                กรุณาตรวจสอบอีเมลของคุณและคลิกลิงก์เพื่อรีเซ็ตรหัสผ่าน
                <br />
                (ลิงก์จะหมดอายุใน 1 ชั่วโมง)
              </p>
              <div className="space-y-3">
                <Link
                  href="/auth/login"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  กลับไปหน้าเข้าสู่ระบบ
                </Link>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                  }}
                  className="block w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  ส่งอีเมลอีกครั้ง
                </button>
              </div>
            </div>
          </div>

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

  // Form State
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <span className="text-5xl">🃏</span>
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            ลืมรหัสผ่าน?
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            ไม่ต้องกังวล เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านให้คุณ
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                กรอกอีเมลที่คุณใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปให้คุณ
              </p>
            </div>

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
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setValidationError(undefined);
                  }}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    validationError
                      ? "border-red-300 dark:border-red-700"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-colors`}
                  placeholder="your@email.com"
                />
              </div>
              {validationError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationError}
                </p>
              )}
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
                  <span>กำลังส่งอีเมล...</span>
                </div>
              ) : (
                "ส่งลิงก์รีเซ็ตรหัสผ่าน"
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </form>
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
