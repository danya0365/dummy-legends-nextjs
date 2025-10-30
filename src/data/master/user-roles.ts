export enum UserRole {
  GUEST = "guest",
  PLAYER = "player",
  PREMIUM = "premium",
  MODERATOR = "moderator",
  ADMIN = "admin",
}

export enum UserTitle {
  NONE = "",
  CM = "CM", // Candidate Master
  NM = "NM", // National Master
  FM = "FM", // FIDE Master
  IM = "IM", // International Master
  GM = "GM", // Grandmaster
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  roles: UserRole[];
}

export const PERMISSIONS: Permission[] = [
  {
    id: "play_games",
    name: "เล่นเกม",
    description: "สามารถเล่นเกมหมากรุกได้",
    roles: [UserRole.PLAYER, UserRole.PREMIUM, UserRole.MODERATOR, UserRole.ADMIN],
  },
  {
    id: "join_tournaments",
    name: "เข้าร่วมทัวร์นาเม้นต์",
    description: "สามารถเข้าร่วมทัวร์นาเม้นต์ได้",
    roles: [UserRole.PLAYER, UserRole.PREMIUM, UserRole.MODERATOR, UserRole.ADMIN],
  },
  {
    id: "create_tournaments",
    name: "สร้างทัวร์นาเม้นต์",
    description: "สามารถสร้างทัวร์นาเม้นต์ได้",
    roles: [UserRole.PREMIUM, UserRole.MODERATOR, UserRole.ADMIN],
  },
  {
    id: "unlimited_analysis",
    name: "วิเคราะห์ไม่จำกัด",
    description: "สามารถวิเคราะห์เกมได้ไม่จำกัด",
    roles: [UserRole.PREMIUM, UserRole.ADMIN],
  },
  {
    id: "advanced_stats",
    name: "สถิติขั้นสูง",
    description: "เข้าถึงสถิติและกราฟขั้นสูง",
    roles: [UserRole.PREMIUM, UserRole.ADMIN],
  },
  {
    id: "moderate_content",
    name: "ดูแลเนื้อหา",
    description: "สามารถดูแลและลบเนื้อหาที่ไม่เหมาะสม",
    roles: [UserRole.MODERATOR, UserRole.ADMIN],
  },
  {
    id: "ban_users",
    name: "แบนผู้ใช้",
    description: "สามารถแบนผู้ใช้ที่ละเมิดกฎได้",
    roles: [UserRole.MODERATOR, UserRole.ADMIN],
  },
  {
    id: "manage_system",
    name: "จัดการระบบ",
    description: "เข้าถึงระบบจัดการทั้งหมด",
    roles: [UserRole.ADMIN],
  },
];

export function hasPermission(userRole: UserRole, permissionId: string): boolean {
  const permission = PERMISSIONS.find((p) => p.id === permissionId);
  if (!permission) return false;
  return permission.roles.includes(userRole);
}

export function getRolePermissions(role: UserRole): Permission[] {
  return PERMISSIONS.filter((p) => p.roles.includes(role));
}
