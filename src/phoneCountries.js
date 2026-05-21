export const DEFAULT_PHONE_COUNTRY = 'BR';

export const phoneCountries = [
  { iso: 'BR', dial: '55', name: 'Brasil', flag: '🇧🇷', nationalMin: 10, nationalMax: 11 },
  { iso: 'AR', dial: '54', name: 'Argentina', flag: '🇦🇷', nationalMin: 10, nationalMax: 11 },
  { iso: 'BO', dial: '591', name: 'Bolívia', flag: '🇧🇴', nationalMin: 8, nationalMax: 8 },
  { iso: 'CL', dial: '56', name: 'Chile', flag: '🇨🇱', nationalMin: 9, nationalMax: 9 },
  { iso: 'CO', dial: '57', name: 'Colômbia', flag: '🇨🇴', nationalMin: 10, nationalMax: 10 },
  { iso: 'EC', dial: '593', name: 'Equador', flag: '🇪🇨', nationalMin: 9, nationalMax: 9 },
  { iso: 'PY', dial: '595', name: 'Paraguai', flag: '🇵🇾', nationalMin: 9, nationalMax: 9 },
  { iso: 'PE', dial: '51', name: 'Peru', flag: '🇵🇪', nationalMin: 9, nationalMax: 9 },
  { iso: 'UY', dial: '598', name: 'Uruguai', flag: '🇺🇾', nationalMin: 8, nationalMax: 8 },
  { iso: 'VE', dial: '58', name: 'Venezuela', flag: '🇻🇪', nationalMin: 10, nationalMax: 10 },
  { iso: 'PT', dial: '351', name: 'Portugal', flag: '🇵🇹', nationalMin: 9, nationalMax: 9 },
  { iso: 'ES', dial: '34', name: 'Espanha', flag: '🇪🇸', nationalMin: 9, nationalMax: 9 },
  { iso: 'US', dial: '1', name: 'Estados Unidos', flag: '🇺🇸', nationalMin: 10, nationalMax: 10 },
  { iso: 'MX', dial: '52', name: 'México', flag: '🇲🇽', nationalMin: 10, nationalMax: 10 },
  { iso: 'DE', dial: '49', name: 'Alemanha', flag: '🇩🇪', nationalMin: 10, nationalMax: 11 },
  { iso: 'FR', dial: '33', name: 'França', flag: '🇫🇷', nationalMin: 9, nationalMax: 9 },
  { iso: 'GB', dial: '44', name: 'Reino Unido', flag: '🇬🇧', nationalMin: 10, nationalMax: 10 },
  { iso: 'IT', dial: '39', name: 'Itália', flag: '🇮🇹', nationalMin: 9, nationalMax: 10 },
  { iso: 'CN', dial: '86', name: 'China', flag: '🇨🇳', nationalMin: 11, nationalMax: 11 },
  { iso: 'IN', dial: '91', name: 'Índia', flag: '🇮🇳', nationalMin: 10, nationalMax: 10 },
];

export function getPhoneCountry(iso) {
  return phoneCountries.find((entry) => entry.iso === iso)
    ?? phoneCountries.find((entry) => entry.iso === DEFAULT_PHONE_COUNTRY);
}

export function formatBrazilNational(digits) {
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatNationalPhone(iso, value) {
  const country = getPhoneCountry(iso);
  const digits = value.replace(/\D/g, '').slice(0, country.nationalMax);
  if (iso === 'BR') return formatBrazilNational(digits);
  return digits;
}

export function getNationalPlaceholder(iso) {
  if (iso === 'BR') return '(00) 00000-0000';
  const country = getPhoneCountry(iso);
  return `Número sem +${country.dial}`;
}

export function buildFullWhatsappDigits(iso, nationalValue) {
  const country = getPhoneCountry(iso);
  const national = nationalValue.replace(/\D/g, '');
  if (national.length < country.nationalMin || national.length > country.nationalMax) {
    return null;
  }
  return `${country.dial}${national}`;
}

export function isValidNationalPhone(iso, nationalValue) {
  return buildFullWhatsappDigits(iso, nationalValue) !== null;
}

export function filterPhoneCountries(query) {
  const normalized = query.trim().toLowerCase();
  const digits = normalized.replace(/\D/g, '');
  if (!normalized) return phoneCountries;

  return phoneCountries.filter((country) => (
    country.name.toLowerCase().includes(normalized)
    || country.iso.toLowerCase().includes(normalized)
    || country.dial.startsWith(digits)
    || `+${country.dial}`.includes(digits)
  ));
}

export function formatPhonePreview(iso, nationalValue) {
  const national = nationalValue.replace(/\D/g, '');
  if (!national) return '';

  const country = getPhoneCountry(iso);
  if (iso === 'BR') {
    return `+${country.dial} ${formatNationalPhone('BR', nationalValue)}`;
  }
  return `+${country.dial} ${national}`;
}

export function getWhatsappValidationMessage(iso, nationalValue) {
  const national = nationalValue.replace(/\D/g, '');
  const country = getPhoneCountry(iso);

  if (!national) return 'Informe seu WhatsApp';
  if (iso === 'BR') {
    if (national.length < 10) return 'Informe o DDD e o número completo';
    if (national.length > 11) return 'Número brasileiro inválido';
    return 'Informe um WhatsApp válido com DDD';
  }
  if (national.length < country.nationalMin) {
    return `Informe pelo menos ${country.nationalMin} dígitos`;
  }
  if (national.length > country.nationalMax) return 'Número muito longo para este país';
  return 'Informe um WhatsApp válido';
}
