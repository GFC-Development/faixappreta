import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      isOwner: boolean;
      studentType: string;
      modalities: string;
      belt: string;
      degrees: number;
      isKids: boolean;
      photoUrl?: string | null;
      tenantSlug: string;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isOwner: boolean;
    studentType: string;
    modalities: string;
    belt: string;
    degrees: number;
    isKids: boolean;
    photoUrl?: string | null;
    tenantSlug: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    isOwner: boolean;
    studentType: string;
    modalities: string;
    belt: string;
    degrees: number;
    isKids: boolean;
    photoUrl?: string | null;
    tenantSlug: string;
  }
}
