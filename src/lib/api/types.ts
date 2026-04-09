import type {
  User,
  Creator,
  App,
  AppAsset,
  AppVersion,
  Category,
  Tag,
  UserRole,
  AppStatus,
  AssetType,
} from '@prisma/client'

// ── Sanitized user (no passwordHash / deletedAt) ────────────────────────────
export type SafeUser = Omit<User, 'passwordHash' | 'deletedAt'>

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken:  string
  refreshToken: string
}

export interface AuthResponse {
  user:   SafeUser
  tokens: AuthTokens
}

// ── API response envelope ─────────────────────────────────────────────────────
// Every Fastify route replies with { success: true, data: T }
export interface ApiResponse<T> {
  success: true
  data:    T
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface Paginated<T> {
  items: T[]
  total: number
  page:  number
  limit: number
  pages: number
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export interface ReviewUser {
  id:        string
  email:     string
  avatarUrl: string | null
}

export interface AppReview {
  id:        string
  appId:     string
  userId:    string
  rating:    number
  comment:   string
  createdAt: string
  updatedAt: string
  user:      ReviewUser
}

export interface ReviewStats {
  items:     AppReview[]
  total:     number
  page:      number
  limit:     number
  pages:     number
  avgRating: number | null
}

// ── Re-exports for components that need domain shapes ─────────────────────────
export type { Creator, App, AppAsset, AppVersion, Category, Tag, UserRole, AppStatus, AssetType }
