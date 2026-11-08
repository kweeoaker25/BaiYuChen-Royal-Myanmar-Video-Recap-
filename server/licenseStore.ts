import { LicenseInfo, UserSession } from '../src/types/index.js';

export const OWNER_EMAIL = 'fighterking2567@gmail.com';
export const OWNER_TELEGRAM = '@baiyuchen10';

interface StoredLicense extends LicenseInfo {
  createdAtMs: number;
  durationDays: number;
}

// In-memory persistent database for server uptime
const licensesMap: Map<string, StoredLicense> = new Map();
const userUsageMap: Map<string, { count: number; date: string }> = new Map();

// Seed initial VIP and Trial keys so they can be used immediately
const INITIAL_KEYS: { key: string; tier: 'premium_vip' | 'free_trial'; note: string; days: number }[] = [
  { key: 'ROYAL-VIP-9999-7777', tier: 'premium_vip', note: 'VIP Unlimited Master License', days: 365 },
  { key: 'ROYAL-VIP-BAI-100S', tier: 'premium_vip', note: 'Owner VIP License @baiyuchen10', days: 365 },
  { key: 'TRIAL-30D-FREE-2026', tier: 'free_trial', note: 'Standard 30-Day Free Trial', days: 30 },
  { key: 'ROYAL-PREM-8888-2222', tier: 'premium_vip', note: 'Pro Video Recap VIP', days: 365 },
];

INITIAL_KEYS.forEach(k => {
  const now = Date.now();
  const expiresAtMs = now + k.days * 24 * 60 * 60 * 1000;
  licensesMap.set(k.key, {
    key: k.key,
    tier: k.tier,
    status: 'active',
    expiresAt: new Date(expiresAtMs).toISOString(),
    daysRemaining: k.days,
    note: k.note,
    usageCount: 0,
    maxUsage: k.tier === 'premium_vip' ? 999999 : 50,
    createdAt: new Date(now).toISOString(),
    createdAtMs: now,
    durationDays: k.days,
  });
});

export function verifyOrGetLicense(key: string): StoredLicense | null {
  const lic = licensesMap.get(key.trim().toUpperCase());
  if (!lic) return null;

  // Refresh remaining days
  const now = Date.now();
  const expiresAtMs = new Date(lic.expiresAt).getTime();
  const msRemaining = expiresAtMs - now;
  lic.daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

  if (msRemaining <= 0 && lic.status === 'active') {
    lic.status = 'expired';
  }

  return lic;
}

export function activateLicenseKey(key: string, userEmail?: string): { success: boolean; license?: StoredLicense; message: string } {
  const cleanKey = key.trim().toUpperCase();
  const lic = verifyOrGetLicense(cleanKey);

  if (!lic) {
    return {
      success: false,
      message: 'မှားယွင်းနေသော License Key ဖြစ်ပါသည်။ Telegram @baiyuchen10 သို့ ဆက်သွယ်ပါ။',
    };
  }

  if (lic.status === 'revoked') {
    return {
      success: false,
      message: 'ဤ License Key ကို ပယ်ဖျက်ထားပြီး ဖြစ်ပါသည်။',
    };
  }

  if (lic.status === 'expired') {
    return {
      success: false,
      message: 'ဤ License Key ၏ သက်တမ်း ကုန်ဆုံးသွားပါပြီ။ Premium ဝယ်ယူရန် Telegram @baiyuchen10 သို့ ဆက်သွယ်ပါ။',
    };
  }

  if (userEmail) {
    lic.assignedEmail = userEmail;
  }

  return {
    success: true,
    license: lic,
    message: lic.tier === 'premium_vip' 
      ? 'ဂုဏ်ယူပါသည်! VIP Unlimited License Key အောင်မြင်စွာ အတည်ပြုပြီးပါပြီ။'
      : '၃၀ ရက်တာ အခမဲ့ စမ်းသပ်အသုံးပြုခွင့် အောင်မြင်စွာ ဖွင့်လှစ်ပြီးပါပြီ။',
  };
}

export function generateNewLicense(tier: 'premium_vip' | 'free_trial', note?: string, email?: string, days = 30): StoredLicense {
  const prefix = tier === 'premium_vip' ? 'ROYAL-VIP' : 'TRIAL-30D';
  const randomPart1 = Math.floor(1000 + Math.random() * 9000);
  const randomPart2 = Math.floor(1000 + Math.random() * 9000);
  const key = `${prefix}-${randomPart1}-${randomPart2}`;

  const now = Date.now();
  const expiresAtMs = now + days * 24 * 60 * 60 * 1000;

  const license: StoredLicense = {
    key,
    tier,
    status: 'active',
    expiresAt: new Date(expiresAtMs).toISOString(),
    daysRemaining: days,
    note: note || (tier === 'premium_vip' ? 'Owner Issued VIP Unlimited' : '30-Day Free Trial Key'),
    assignedEmail: email,
    usageCount: 0,
    maxUsage: tier === 'premium_vip' ? 999999 : 50,
    createdAt: new Date(now).toISOString(),
    createdAtMs: now,
    durationDays: days,
  };

  licensesMap.set(key, license);
  return license;
}

export function revokeLicenseKey(key: string): boolean {
  const lic = licensesMap.get(key.trim().toUpperCase());
  if (lic) {
    lic.status = 'revoked';
    return true;
  }
  return false;
}

export function getAllLicensesList(): StoredLicense[] {
  return Array.from(licensesMap.values()).map(lic => {
    const expiresAtMs = new Date(lic.expiresAt).getTime();
    const msRemaining = expiresAtMs - Date.now();
    lic.daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
    return lic;
  });
}

export function checkAndIncrementUsage(userId: string, isVip: boolean): { allowed: boolean; remaining: number; dailyUsage: number; maxUsage: number } {
  if (isVip) {
    return { allowed: true, remaining: 999999, dailyUsage: 0, maxUsage: 999999 };
  }

  const today = new Date().toISOString().slice(0, 10);
  const userRecord = userUsageMap.get(userId);

  if (!userRecord || userRecord.date !== today) {
    userUsageMap.set(userId, { count: 1, date: today });
    return { allowed: true, remaining: 9, dailyUsage: 1, maxUsage: 10 };
  }

  const maxDaily = 10;
  if (userRecord.count >= maxDaily) {
    return { allowed: false, remaining: 0, dailyUsage: userRecord.count, maxUsage: maxDaily };
  }

  userRecord.count += 1;
  return {
    allowed: true,
    remaining: maxDaily - userRecord.count,
    dailyUsage: userRecord.count,
    maxUsage: maxDaily,
  };
}
