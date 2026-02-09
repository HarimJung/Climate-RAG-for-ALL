import { createServiceClient } from '@/lib/supabase/server';
import { PLANS } from '@/lib/constants';

type PlanKey = keyof typeof PLANS;

interface UserProfile {
  plan: PlanKey;
  rag_count_today: number;
  rag_reset_at: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('plan, rag_count_today, rag_reset_at')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data as UserProfile;
  } catch {
    return null;
  }
}

export function checkPlanAccess(userPlan: PlanKey, requiredPlan: PlanKey): boolean {
  const planOrder: PlanKey[] = ['free', 'library', 'pro', 'kit'];
  return planOrder.indexOf(userPlan) >= planOrder.indexOf(requiredPlan);
}

export function getRagLimit(plan: PlanKey): number {
  return PLANS[plan]?.ragLimit ?? PLANS.free.ragLimit;
}

export async function canUseRag(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('plan, rag_count_today, rag_reset_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { allowed: true, remaining: PLANS.free.ragLimit };
    }

    const profile = data as UserProfile;
    const today = new Date().toISOString().split('T')[0];

    // Reset daily counter if new day
    if (profile.rag_reset_at !== today) {
      await supabase
        .from('user_profiles')
        .update({ rag_count_today: 0, rag_reset_at: today })
        .eq('id', userId);
      profile.rag_count_today = 0;
    }

    const limit = getRagLimit(profile.plan);
    const remaining = limit - profile.rag_count_today;

    return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
  } catch {
    return { allowed: true, remaining: PLANS.free.ragLimit };
  }
}
