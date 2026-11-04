// Countries with ISO code and international dialling code. Add more rows as needed.
export const COUNTRIES = [
  { iso: 'US', name: 'United States', dial: '+1' },
  { iso: 'CA', name: 'Canada', dial: '+1' },
  { iso: 'GB', name: 'United Kingdom', dial: '+44' },
  { iso: 'IE', name: 'Ireland', dial: '+353' },
  { iso: 'IN', name: 'India', dial: '+91' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '+971' },
  { iso: 'SA', name: 'Saudi Arabia', dial: '+966' },
  { iso: 'SG', name: 'Singapore', dial: '+65' },
  { iso: 'MY', name: 'Malaysia', dial: '+60' },
  { iso: 'PH', name: 'Philippines', dial: '+63' },
  { iso: 'AU', name: 'Australia', dial: '+61' },
  { iso: 'NZ', name: 'New Zealand', dial: '+64' },
  { iso: 'ZA', name: 'South Africa', dial: '+27' },
  { iso: 'NG', name: 'Nigeria', dial: '+234' },
  { iso: 'KE', name: 'Kenya', dial: '+254' },
  { iso: 'DE', name: 'Germany', dial: '+49' },
  { iso: 'FR', name: 'France', dial: '+33' },
  { iso: 'ES', name: 'Spain', dial: '+34' },
  { iso: 'IT', name: 'Italy', dial: '+39' },
  { iso: 'NL', name: 'Netherlands', dial: '+31' },
  { iso: 'SE', name: 'Sweden', dial: '+46' },
  { iso: 'CH', name: 'Switzerland', dial: '+41' },
  { iso: 'BR', name: 'Brazil', dial: '+55' },
  { iso: 'MX', name: 'Mexico', dial: '+52' },
  { iso: 'JP', name: 'Japan', dial: '+81' },
  { iso: 'CN', name: 'China', dial: '+86' },
  { iso: 'PK', name: 'Pakistan', dial: '+92' },
  { iso: 'BD', name: 'Bangladesh', dial: '+880' },
  { iso: 'LK', name: 'Sri Lanka', dial: '+94' },
  { iso: 'NP', name: 'Nepal', dial: '+977' },
].sort((a, b) => a.name.localeCompare(b.name));

export const countryByIso = (iso) => COUNTRIES.find((c) => c.iso === iso);
export const dialFor = (iso) => countryByIso(iso)?.dial || '';
export const PHONE_TYPES = ['Mobile', 'Work', 'Home', 'Other'];

/** "+91 98765 43210" */
export const formatPhone = (p) => (p?.number ? `${dialFor(p.country)} ${p.number}`.trim() : '');
