"use client";

import Link from "next/link";
import { Facebook, Twitter, Youtube, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "ทัวร์นาเมนต์", href: "/tournaments" },
      { name: "อันดับผู้เล่น", href: "/leaderboard" },
      { name: "คอมมูนิตี้", href: "/community" },
      { name: "เล่นเป็นแขก", href: "/game/lobby" },
    ],
    support: [
      { name: "ศูนย์ช่วยเหลือ", href: "/help" },
      { name: "กติกาการเล่น", href: "/rules" },
      { name: "คำถามที่พบบ่อย", href: "/faq" },
      { name: "ติดต่อเรา", href: "/contact" },
    ],
    company: [
      { name: "เกี่ยวกับเรา", href: "/about" },
      { name: "ข่าวสาร", href: "/blog" },
      { name: "ร่วมงานกับเรา", href: "/careers" },
      { name: "พันธมิตร", href: "/partners" },
    ],
    legal: [
      { name: "ข้อกำหนดการใช้งาน", href: "/terms" },
      { name: "นโยบายความเป็นส่วนตัว", href: "/privacy" },
      { name: "นโยบายคุกกี้", href: "/cookies" },
    ],
  };

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "https://facebook.com/dummylegends" },
    { name: "Twitter", icon: Twitter, href: "https://twitter.com/dummylegends" },
    { name: "YouTube", icon: Youtube, href: "https://youtube.com/dummylegends" },
    { name: "Email", icon: Mail, href: "mailto:support@dummylegends.com" },
  ];

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
          {/* Brand Section */}
          <div className="col-span-2">
            <Link
              href="/"
              className="flex items-center space-x-2 text-2xl font-bold text-blue-600 dark:text-blue-400"
            >
              <span className="text-3xl">🃏</span>
              <span>Dummy Legends</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
              แพลตฟอร์มแข่งขันเกมไพ่ดัมมี่ออนไลน์ระดับโปร
              รองรับทัวร์นาเมนต์ จัดอันดับ พร้อมระบบคอมมูนิตี้ครบวงจร
            </p>
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              ผลิตภัณฑ์
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              สนับสนุน
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              บริษัท
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} Dummy Legends. All rights reserved. Made with ❤️ in Thailand
            </p>
            <div className="mt-4 md:mt-0">
              <ul className="flex space-x-6">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
