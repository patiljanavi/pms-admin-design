// Shortcodes for the text editor's "Shortcodes" menu.
// { title, isBold: true }            → section heading
// { title, isBold: false, value }    → inserted as [VALUE]

const dateShortcuts = [
  { title: 'Date Shortcodes', isBold: true },
  { title: 'Current day full date', isBold: false, value: 'CURRENT_DAY_FULL_DATE' },
  { title: 'Current day number', isBold: false, value: 'CURRENT_DAY_NUMBER' },
  { title: 'Current day name', isBold: false, value: 'CURRENT_DAY_NAME' },
  { title: 'Current week', isBold: false, value: 'CURRENT_WEEK' },
  { title: 'Current month number', isBold: false, value: 'CURRENT_MONTH_NUMBER' },
  { title: 'Current month name', isBold: false, value: 'CURRENT_MONTH_NAME' },
  { title: 'Current quarter', isBold: false, value: 'CURRENT_QUARTER' },
  { title: 'Current year', isBold: false, value: 'CURRENT_YEAR' },
  { title: 'Last day full date', isBold: false, value: 'LAST_DAY_FULL_DATE' },
  { title: 'Last day number', isBold: false, value: 'LAST_DAY_NUMBER' },
  { title: 'Last day name', isBold: false, value: 'LAST_DAY_NAME' },
  { title: 'Last week', isBold: false, value: 'LAST_WEEK' },
  { title: 'Last month number', isBold: false, value: 'LAST_MONTH_NUMBER' },
  { title: 'Last month name', isBold: false, value: 'LAST_MONTH_NAME' },
  { title: 'Last quarter', isBold: false, value: 'LAST_QUARTER' },
  { title: 'Last year', isBold: false, value: 'LAST_YEAR' },
  { title: 'Next day full date', isBold: false, value: 'NEXT_DAY_FULL_DATE' },
  { title: 'Next day number', isBold: false, value: 'NEXT_DAY_NUMBER' },
  { title: 'Next day name', isBold: false, value: 'NEXT_DAY_NAME' },
  { title: 'Next week', isBold: false, value: 'NEXT_WEEK' },
  { title: 'Next month number', isBold: false, value: 'NEXT_MONTH_NUMBER' },
  { title: 'Next month name', isBold: false, value: 'NEXT_MONTH_NAME' },
  { title: 'Next quarter', isBold: false, value: 'NEXT_QUARTER' },
  { title: 'Next year', isBold: false, value: 'NEXT_YEAR' },
];

export const contactShortcuts = [
  { title: 'Account Shortcodes', isBold: true },
  { title: 'Account Name', isBold: false, value: 'ACCOUNT_NAME' },
  { title: 'Contact Shortcodes', isBold: true },
  { title: 'Contact Name', isBold: false, value: 'CONTACT_NAME' },
  { title: 'First Name', isBold: false, value: 'FIRST_NAME' },
  { title: 'Middle Name', isBold: false, value: 'MIDDLE_NAME' },
  { title: 'Last Name', isBold: false, value: 'LAST_NAME' },
  { title: 'Phone number', isBold: false, value: 'PHONE_NUMBER' },
  { title: 'Country', isBold: false, value: 'COUNTRY' },
  { title: 'Company name', isBold: false, value: 'COMPANY_NAME' },
  { title: 'Street address', isBold: false, value: 'STREET_ADDRESS' },
  { title: 'City', isBold: false, value: 'CITY' },
  { title: 'State/Province', isBold: false, value: 'STATE_PROVINCE' },
  { title: 'Zip/Postal code', isBold: false, value: 'ZIP_POSTAL_CODE' },
  ...dateShortcuts,
];

export const accountShortcuts = [
  { title: 'Account Shortcodes', isBold: true },
  { title: 'Account Name', isBold: false, value: 'ACCOUNT_NAME' },
  ...dateShortcuts,
];