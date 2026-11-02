export const VIP_FOUNDER_EMAILS = [
  "rivalaman123@gmail.com",
];

export function isVipFounder(email?: string | null): boolean {
  if (!email) return false;
  return VIP_FOUNDER_EMAILS.includes(email.toLowerCase().trim());
}

export interface UserSubscriptionContext {
  email?: string | null;
  isPro?: boolean;
}

export function isProUser(user?: UserSubscriptionContext | null): boolean {
  if (!user?.email) return false;
  // Permanent VIP Founder Access: rivalaman123@gmail.com gets 100% features unlocked forever
  if (isVipFounder(user.email)) {
    return true;
  }
  return Boolean(user.isPro);
}
