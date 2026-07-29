import { apiRequest } from './api';

const PAGE_SIZE = 20;

export type ReferralStats = {
  total_referred: number;
  total_earned: number;
  available_balance: number;
  pending_payout_balance: number;
  paid_out_balance: number;
};

export type ReferredUser = {
  id: string;
  firstname: string;
  lastname: string;
  name: string;
  email: string;
  created_at: string;
  total_purchase_amount: number;
  total_reward_amount: number;
  available_reward_amount: number;
  reward_count: number;
};

export type ReferralReward = {
  id: string;
  amount: string | number;
  order_amount?: string | number;
  status?: string;
  created_at?: string;
};

export type PayoutRequest = {
  id: string;
  amount: string | number;
  status: string;
  bank_name: string;
  account_number: string;
  account_name?: string;
  created_at?: string;
};

export type ReferralPagination = {
  limit: number;
  offset: number;
  total: number;
  has_more: boolean;
};

export type ReferralData = {
  settings: {
    is_enabled: boolean;
    bonus_percentage: string;
  };
  referral_code: string;
  referral_link: string;
  referral_count: number;
  stats: ReferralStats;
  referred_users: ReferredUser[];
  referred_users_pagination?: ReferralPagination;
  rewards: ReferralReward[];
  payout_requests: PayoutRequest[];
};

type ReferralsMeResponse = {
  success?: boolean;
  message?: string;
  referral?: ReferralData;
};

type PayoutResponse = {
  success?: boolean;
  message?: string;
  payout?: { amount?: string | number };
};

export type PayoutForm = {
  account_name: string;
  account_number: string;
  bank_name: string;
};

export async function fetchMyReferrals(
  token: string,
  offset = 0,
  limit = PAGE_SIZE,
): Promise<ReferralData> {
  const data = await apiRequest<ReferralsMeResponse>(
    `/referrals/me?limit=${limit}&offset=${offset}`,
    { token },
  );

  if (!data.success || !data.referral) {
    throw { message: data.message || 'Failed to load referrals' };
  }

  return data.referral;
}

export async function requestReferralPayout(
  token: string,
  form: PayoutForm,
): Promise<{ amount?: string | number; message?: string }> {
  const data = await apiRequest<PayoutResponse>('/referrals/payout', {
    method: 'POST',
    token,
    body: form,
  });

  if (!data.success) {
    throw { message: data.message || 'Payout request failed.' };
  }

  return {
    amount: data.payout?.amount,
    message: data.message,
  };
}

export { PAGE_SIZE };
