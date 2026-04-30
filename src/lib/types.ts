export type Role =
  | "admin"
  | "iria"
  | "curator"
  | "facilitator"
  | "maintenance"
  | "social"
  | "research";

export type UserStatus = "pending" | "verified" | "rejected" | "suspended";

export type Category =
  | "question"
  | "suggestion"
  | "appreciation"
  | "reframing"
  | "maintenance"
  | "research";

export type ObservationStatus =
  | "new"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "dismissed";

export interface User {
  id: string;
  email: string;
  display_name: string;
  profile_photo: string | null;
  age: number | null;
  phone: string | null;
  languages: string[] | null;
  role: Role;
  status: UserStatus;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  last_seen_at?: string;
}

export interface Gallery {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Exhibit {
  id: string;
  gallery_id: string;
  name: string;
  image_url: string | null;
  description: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Observation {
  id: string;
  facilitator_id: string;
  exhibit_id: string;
  gallery_id: string;
  session_id: string | null;
  category: Category;
  sub_type: string | null;
  fields: Record<string, unknown>;
  free_text: string | null;
  photo_url: string | null;
  status: ObservationStatus;
  status_updated_at: string | null;
  status_updated_by: string | null;
  created_at: string;
}

export interface Reply {
  id: string;
  observation_id: string;
  author_id: string;
  body: string;
  attachment_url: string | null;
  is_internal: boolean;
  created_at: string;
}

// Per-category visual + routing metadata (brutalist palette)
export const CATEGORY_META: Record<
  Category,
  {
    label: string;
    short: string;
    emoji: string;
    badge: string;
    accent: string;
    routesTo: Role[];
  }
> = {
  question: {
    label: "Question I couldn't answer",
    short: "Question",
    emoji: "❓",
    badge: "bg-yellow-200",
    accent: "text-yellow-900",
    routesTo: ["curator"],
  },
  suggestion: {
    label: "Visitor suggestion",
    short: "Suggestion",
    emoji: "💡",
    badge: "bg-brutal-yellow",
    accent: "text-yellow-900",
    routesTo: ["curator"],
  },
  appreciation: {
    label: "Appreciation moment",
    short: "Appreciation",
    emoji: "❤️",
    badge: "bg-brutal-red text-white",
    accent: "text-brutal-red",
    routesTo: ["social"],
  },
  reframing: {
    label: "Novel reframing",
    short: "Reframing",
    emoji: "🔄",
    badge: "bg-purple-200",
    accent: "text-purple-900",
    routesTo: ["curator"],
  },
  maintenance: {
    label: "Maintenance issue",
    short: "Maintenance",
    emoji: "🔧",
    badge: "bg-brutal-red text-white",
    accent: "text-brutal-red",
    routesTo: ["maintenance"],
  },
  research: {
    label: "Research observation",
    short: "Research",
    emoji: "🧠",
    badge: "bg-blue-200",
    accent: "text-blue-900",
    routesTo: ["research"],
  },
};

export const ROLE_META: Record<Role, { label: string; landing: string }> = {
  admin:        { label: "Admin",        landing: "/admin" },
  iria:         { label: "IRIA Lab",     landing: "/curator" },
  curator:      { label: "Curator",      landing: "/curator" },
  facilitator:  { label: "Facilitator",  landing: "/facilitator" },
  maintenance:  { label: "Maintenance",  landing: "/curator" },
  social:       { label: "Social Media", landing: "/curator" },
  research:     { label: "Research",     landing: "/curator" },
};

/**
 * Which categories a given role should see in their inbox.
 * IRIA = everything except maintenance (research data stream only).
 */
export function categoriesForRole(role: Role): Category[] {
  switch (role) {
    case "admin":
      return ["question", "suggestion", "appreciation", "reframing", "maintenance", "research"];
    case "iria":
      return ["question", "suggestion", "appreciation", "reframing", "research"];
    case "curator":
      return ["question", "suggestion", "reframing"];
    case "social":
      return ["appreciation"];
    case "maintenance":
      return ["maintenance"];
    case "research":
      return ["research"];
    default:
      return [];
  }
}
