export type IconName =
  | 'home'
  | 'ledger'
  | 'settings'
  | 'bell'
  | 'bellHeader'
  | 'profile'
  | 'income'
  | 'expense'
  | 'profit'
  | 'cash'
  | 'mobilepay'
  | 'wallet'
  | 'savings'
  | 'orders'
  | 'customers'
  | 'inventory'
  | 'garment'
  | 'grocery'
  | 'tag'
  | 'book'
  | 'more'
  | 'backup'
  | 'help'
  | 'staff'
  | 'dashboard'
  | 'flash'
  | 'receipt'
  | 'pm_cash'
  | 'pm_bkash'
  | 'pm_nagad'
  | 'pm_rocket';

export const ICON_SVG: Record<IconName, string> = {
  home: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3 21 11H3Z" fill="#ff6b6b"/><rect x="5.5" y="10.5" width="13" height="9.5" rx="1.6" fill="#ffd27d"/><rect x="9.7" y="13.5" width="4.6" height="6.5" rx="1" fill="#b5773a"/><rect x="14" y="6.7" width="2.2" height="3" rx=".5" fill="#ff8a3d"/></svg>`,
  ledger: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="3.5" width="13" height="17" rx="2.2" fill="#16b886"/><rect x="5" y="3.5" width="3.4" height="17" rx="1.2" fill="#0f9d72"/><rect x="9.6" y="7.2" width="6" height="1.8" rx=".9" fill="#fff"/><rect x="9.6" y="10.6" width="6" height="1.8" rx=".9" fill="#bdf0db"/><rect x="9.6" y="14" width="4" height="1.8" rx=".9" fill="#bdf0db"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#7b8aa3" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.22-1.13.53-1.62.94l-2.39-.96a.488.488 0 0 0-.59.22L2.74 8.87a.488.488 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.49.41 1.03.72 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.22 1.13-.53 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58z"/><circle cx="12" cy="12" r="3.8" fill="#fff"/><circle cx="12" cy="12" r="2" fill="#27a7e1"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3.4a1.6 1.6 0 0 1 1.6 1.6v.5a5.7 5.7 0 0 1 4 5.4c0 4.8 1.9 6.2 1.9 6.2H4.5s1.9-1.4 1.9-6.2a5.7 5.7 0 0 1 4-5.4V5A1.6 1.6 0 0 1 12 3.4Z" fill="#ffc24b"/><path d="M9.8 18.6a2.2 2.2 0 0 0 4.4 0z" fill="#ff8a3d"/><circle cx="17" cy="6.5" r="2.4" fill="#ff5a78"/></svg>`,
  bellHeader: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3.4a1.6 1.6 0 0 1 1.6 1.6v.5a5.7 5.7 0 0 1 4 5.4c0 4.8 1.9 6.2 1.9 6.2H4.5s1.9-1.4 1.9-6.2a5.7 5.7 0 0 1 4-5.4V5A1.6 1.6 0 0 1 12 3.4Z" fill="#ffffff"/><path d="M9.8 18.6a2.2 2.2 0 0 0 4.4 0z" fill="rgba(255,255,255,0.9)"/></svg>`,
  profile: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" fill="#27a7e1"/><circle cx="12" cy="10" r="3.2" fill="#fff"/><path d="M5.9 18.6a6.1 6.1 0 0 1 12.2 0A9 9 0 0 1 5.9 18.6Z" fill="#fff"/></svg>`,
  income: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" fill="#16b886"/><path d="M12 17 7.5 11H10.5V7h3v4h3z" fill="#fff"/></svg>`,
  expense: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" fill="#ff5a78"/><path d="M12 7 16.5 13H13.5v4h-3v-4H7.5z" fill="#fff"/></svg>`,
  profit: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2.8" y="4" width="18.4" height="16" rx="3.2" fill="#e7faf2"/><path d="M6 15 10 11l3 2.6L18 8.5" fill="none" stroke="#16b886" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.8 8.5H18v3.2" fill="none" stroke="#16b886" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  cash: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2.6" y="6.4" width="18.8" height="11.2" rx="2.4" fill="#16b886"/><circle cx="12" cy="12" r="2.8" fill="#bdf0db"/><circle cx="6" cy="9.2" r="1.1" fill="#7fe0bb"/><circle cx="18" cy="14.8" r="1.1" fill="#7fe0bb"/></svg>`,
  mobilepay: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="6.4" y="3" width="11.2" height="18" rx="2.8" fill="#2a3550"/><rect x="7.9" y="5.6" width="8.2" height="10.4" rx="1.2" fill="#d8f3ff"/><circle cx="12" cy="10.8" r="2.5" fill="#ffc24b"/><circle cx="12" cy="18.4" r=".9" fill="#5b6b85"/></svg>`,
  wallet: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="3.4" y="6.4" width="17.2" height="12" rx="2.8" fill="#b07d56"/><path d="M3.4 9.4h17.2" stroke="#8a5f3c" stroke-width="1.4"/><rect x="12.8" y="11" width="7.8" height="4.2" rx="2.1" fill="#8a5f3c"/><circle cx="16.4" cy="13.1" r="1.1" fill="#ffc24b"/></svg>`,
  savings: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="14.6" rx="6.6" ry="2.6" fill="#ffd98a"/><ellipse cx="12" cy="10.6" rx="6.6" ry="2.6" fill="#ffce5e"/><ellipse cx="12" cy="6.6" rx="6.6" ry="2.6" fill="#ffc24b"/><path d="M10.6 6.4h2.8" stroke="#e9a417" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  orders: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6 8h12l-1 11.4a1.6 1.6 0 0 1-1.6 1.4H8.6A1.6 1.6 0 0 1 7 19.4z" fill="#27a7e1"/><path d="M9 9V7a3 3 0 0 1 6 0v2" fill="none" stroke="#1f6f99" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="12.4" r="1.1" fill="#fff"/><circle cx="15" cy="12.4" r="1.1" fill="#fff"/></svg>`,
  customers: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="7.8" r="3" fill="#ff8a80"/><path d="M7 18c0-2.8 2.2-4.6 5-4.6s5 1.8 5 4.6z" fill="#27a7e1"/><circle cx="5" cy="10.4" r="2" fill="#ffb74d"/><circle cx="19" cy="10.4" r="2" fill="#16b886"/></svg>`,
  inventory: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3 20.5 7.5 12 12 3.5 7.5z" fill="#d49a5a"/><path d="M3.5 7.5 12 12v9L3.5 16.5z" fill="#b07d56"/><path d="M20.5 7.5 12 12v9l8.5-4.5z" fill="#c98c4a"/><path d="M7.6 5.3 16.2 9.8" stroke="#8a5f3c" stroke-width="1.2"/></svg>`,
  garment: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8.6 4.5 5 7 2.6 9.1l2.4 2.9 2-1.4V20h10v-9.4l2 1.4 2.4-2.9L19 7l-3.6-2.5a3.4 3.4 0 0 1-6.8 0z" fill="#27a7e1"/><path d="M8.6 4.5a3.4 3.4 0 0 0 6.8 0" fill="#1f87b8"/></svg>`,
  grocery: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5.2 10.2h13.6l-1.2 7.6a1.6 1.6 0 0 1-1.6 1.4H8a1.6 1.6 0 0 1-1.6-1.4z" fill="#ff8a3d"/><rect x="4.4" y="8.2" width="15.2" height="2.6" rx="1.3" fill="#ffb020"/><path d="M8.8 8.2 11 4M15.2 8.2 13 4" stroke="#d96a1f" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>`,
  tag: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 11.6V5.6a1.6 1.6 0 0 1 1.6-1.6h6l8.4 8.4a1.6 1.6 0 0 1 0 2.2l-5.4 5.4a1.6 1.6 0 0 1-2.2 0L4 11.6z" fill="#ff5a78"/><circle cx="8.4" cy="8.4" r="1.6" fill="#fff"/></svg>`,
  receipt: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z" fill="#eef3f7"/><rect x="9" y="7.2" width="6" height="1.7" rx=".85" fill="#9aabb6"/><rect x="9" y="10.4" width="6" height="1.7" rx=".85" fill="#9aabb6"/><rect x="9" y="13.6" width="4" height="1.7" rx=".85" fill="#27a7e1"/></svg>`,
  dashboard: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2.8" y="4" width="18.4" height="16" rx="3.2" fill="#e7f3fb"/><rect x="5.8" y="12" width="2.9" height="5" rx="1.2" fill="#27a7e1"/><rect x="10.5" y="8" width="2.9" height="9" rx="1.2" fill="#16b886"/><rect x="15.2" y="10" width="2.9" height="7" rx="1.2" fill="#ffb020"/></svg>`,
  flash: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" fill="#FFB020"/><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" fill="none" stroke="#E69500" stroke-width=".6" stroke-linejoin="round"/></svg>`,
  book: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="3.5" width="13" height="17" rx="2.2" fill="#8b5cf6"/><rect x="5" y="3.5" width="3.4" height="17" rx="1.2" fill="#7c3aed"/><rect x="9.6" y="7.2" width="6" height="1.8" rx=".9" fill="#fff"/><rect x="9.6" y="10.6" width="6" height="1.8" rx=".9" fill="#ddd6fe"/><rect x="9.6" y="14" width="4" height="1.8" rx=".9" fill="#ddd6fe"/></svg>`,
  more: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2.8" y="4" width="18.4" height="16" rx="3.2" fill="#e7f3fb"/><circle cx="8" cy="12" r="1.6" fill="#27a7e1"/><circle cx="12" cy="12" r="1.6" fill="#16b886"/><circle cx="16" cy="12" r="1.6" fill="#ffb020"/></svg>`,
  backup: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="4.6" y="6.5" width="14.8" height="14" rx="2.4" fill="#27a7e1"/><path d="M9 6.5V5a3 3 0 0 1 6 0v1.5" fill="none" stroke="#1f6f99" stroke-width="2"/><path d="M12 10v6M9 13l3-3 3 3" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  help: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" fill="#ffc24b"/><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17" r="1.2" fill="#fff"/></svg>`,
  staff: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="8.5" cy="9" r="3.2" fill="#ffb74d"/><path d="M3.4 19.2c0-3 2.3-4.9 5.1-4.9s5.1 1.9 5.1 4.9z" fill="#27a7e1"/><circle cx="16.6" cy="10" r="2.6" fill="#ff8a80"/><path d="M14.2 19.2c.1-2.6 1.4-4.1 3.9-4.1 1 0 1.9.3 2.5.7v3.4z" fill="#8b5cf6"/></svg>`,

  pm_cash: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="9.5" width="13" height="8.5" rx="2" fill="#1B5E20" opacity="0.35"/><rect x="5" y="7.5" width="13" height="8.5" rx="2" fill="#2E7D32" opacity="0.55"/><rect x="3" y="5.5" width="13" height="8.5" rx="2" fill="#43A047"/><rect x="5.2" y="7.9" width="4.5" height="1.2" rx="0.6" fill="#fff" opacity="0.75"/><rect x="5.2" y="9.8" width="3" height="1" rx="0.5" fill="#fff" opacity="0.5"/><circle cx="13.5" cy="8.5" r="3.2" fill="#fff" opacity="0.96"/><rect x="12.0" y="7.0" width="3.0" height="0.85" rx="0.42" fill="#2E7D32"/><rect x="12.0" y="8.35" width="3.0" height="0.85" rx="0.42" fill="#2E7D32"/><rect x="13.1" y="7.0" width="0.9" height="3.1" rx="0.45" fill="#2E7D32"/></svg>`,

  pm_bkash: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="22" height="22" rx="7" fill="#E2136E"/><rect x="7.5" y="4.5" width="3.2" height="15" rx="1.6" fill="#fff"/><circle cx="13.8" cy="15.5" r="4.2" fill="#fff"/><circle cx="13.8" cy="15.5" r="2.4" fill="#E2136E"/></svg>`,

  pm_nagad: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="#F6921E"/><path d="M6.5 16.5 C6.5 10 9.5 6.5 12 6.5 C14.5 6.5 14.5 9 14.5 10 C14.5 11 14 12.5 12 12.5 C10 12.5 9.5 14 9.5 15.5 C9.5 16.5 10 17.5 11.5 17.5 C13.5 17.5 15 16 16 14 L17.5 15 C16.2 17.8 14 19.5 11.5 19.5 C9 19.5 6.5 18 6.5 16.5Z" fill="#fff"/></svg>`,

  pm_rocket: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="22" height="22" rx="7" fill="#8B2FC9"/><path d="M12 4 C12 4 8 8.5 8 13.5 L8 16 L16 16 L16 13.5 C16 8.5 12 4 12 4Z" fill="#fff"/><path d="M8 15 L5.5 18.5 L8 17.5Z" fill="#fff"/><path d="M16 15 L18.5 18.5 L16 17.5Z" fill="#fff"/><circle cx="12" cy="11.5" r="2" fill="#8B2FC9"/><rect x="10.2" y="16" width="3.6" height="2" rx="1" fill="#FFD700"/></svg>`,
};
