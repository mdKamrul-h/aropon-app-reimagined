/** Map Supabase auth errors to Bangla messages for shopkeepers. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('hook') || m.includes('sms') || m.includes('500')) {
    return 'SMS পাঠানো যায়নি। সার্ভার সেটআপ (Send SMS Hook + secrets) যাচাই করুন।';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
  }
  if (m.includes('invalid') && m.includes('otp')) {
    return 'ভুল OTP। আবার চেষ্টা করুন।';
  }
  if (m.includes('expired')) {
    return 'OTP মেয়াদ শেষ। নতুন OTP পাঠান।';
  }
  if (m.includes('phone') && m.includes('invalid')) {
    return 'মোবাইল নম্বর সঠিক নয়। 01XXXXXXXXX ফরম্যাটে দিন।';
  }
  if (m.includes('signup') && m.includes('disabled')) {
    return 'ফোন লগইন চালু নেই। Supabase Dashboard → Phone provider চালু করুন।';
  }
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'ইউজারনেম বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।';
  }
  if (m.includes('email') && m.includes('already')) {
    return 'এই ইউজারনেম ইতিমধ্যে নেওয়া হয়েছে। অন্য নাম বেছে নিন।';
  }
  if (m.includes('password') && m.includes('weak')) {
    return 'পাসওয়ার্ড খুব দুর্বল। কমপক্ষে ৬ অক্ষর দিন।';
  }
  return message || 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।';
}
