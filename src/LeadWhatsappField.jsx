import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import {
  DEFAULT_PHONE_COUNTRY,
  filterPhoneCountries,
  formatNationalPhone,
  formatPhonePreview,
  getNationalPlaceholder,
  getPhoneCountry,
  getWhatsappValidationMessage,
  isValidNationalPhone,
  phoneCountries,
} from './phoneCountries.js';

function CountryPickerSheet({ open, selectedIso, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return undefined;
    }

    document.body.classList.add('country-sheet-open');
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 120);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.classList.remove('country-sheet-open');
    };
  }, [open]);

  const filtered = useMemo(() => filterPhoneCountries(query), [query]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="country-sheet-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            className="country-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Selecionar país"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="country-sheet-header">
              <h2 className="country-sheet-title">Selecione o país</h2>
              <button type="button" className="country-sheet-close" onClick={onClose} aria-label="Fechar">
                <X size={28} />
              </button>
            </div>

            <label className="country-sheet-search">
              <Search size={22} aria-hidden />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar país ou código (+55)"
                autoComplete="off"
                enterKeyHint="search"
              />
            </label>

            <ul className="country-sheet-list" role="listbox">
              {filtered.map((country) => {
                const selected = country.iso === selectedIso;
                return (
                  <li key={country.iso}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`country-sheet-option${selected ? ' is-selected' : ''}`}
                      onClick={() => onSelect(country.iso)}
                    >
                      <span className="country-iso-badge" aria-hidden>
                        {country.iso}
                      </span>
                      <span className="country-sheet-option-body">
                        <span className="country-sheet-option-name">{country.name}</span>
                        <span className="country-sheet-option-dial">+{country.dial}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="country-sheet-empty">Nenhum país encontrado</li>
              )}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function LeadWhatsappField({
  phoneCountry,
  whatsapp,
  hasError,
  onCountryChange,
  onWhatsappChange,
  onClearError,
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const country = getPhoneCountry(phoneCountry);
  const isBrazil = phoneCountry === DEFAULT_PHONE_COUNTRY;
  const preview = formatPhonePreview(phoneCountry, whatsapp);
  const errorMessage = hasError ? getWhatsappValidationMessage(phoneCountry, whatsapp) : '';

  const openSheet = () => setSheetOpen(true);

  const selectCountry = (iso) => {
    onClearError();
    onCountryChange(iso);
    setSheetOpen(false);
  };

  const resetToBrazil = () => {
    onClearError();
    onCountryChange(DEFAULT_PHONE_COUNTRY);
  };

  return (
    <>
      <div
        className={`lead-phone-combo${hasError ? ' lead-phone-combo--error' : ''}`}
        role="group"
        aria-labelledby="lead-whatsapp-label"
      >
        <button
          type="button"
          className="lead-phone-prefix"
          onClick={openSheet}
          aria-label={`País ${country.name}, código +${country.dial}. Toque para alterar`}
        >
          <span className="country-iso-badge country-iso-badge--compact" aria-hidden>
            {country.iso}
          </span>
          <span className="lead-phone-prefix-dial">+{country.dial}</span>
        </button>
        <input
          className="lead-phone-input"
          type="tel"
          name="whatsapp"
          autoComplete="tel-national"
          inputMode="tel"
          placeholder={getNationalPlaceholder(phoneCountry)}
          value={whatsapp}
          onChange={(event) => {
            onClearError();
            onWhatsappChange(formatNationalPhone(phoneCountry, event.target.value));
          }}
          aria-invalid={hasError}
          aria-describedby={hasError ? 'lead-whatsapp-error' : preview ? 'lead-whatsapp-preview' : undefined}
          required
        />
      </div>

      {preview && !hasError && (
        <p className="lead-phone-preview" id="lead-whatsapp-preview">
          Enviaremos mensagem para <strong>{preview}</strong>
        </p>
      )}

      <div className="lead-phone-actions">
        {isBrazil ? (
          <button type="button" className="lead-phone-link" onClick={openSheet}>
            Outro país ›
          </button>
        ) : (
          <button type="button" className="lead-phone-link" onClick={resetToBrazil}>
            Voltar para Brasil (+55)
          </button>
        )}
      </div>

      {hasError && (
        <span className="lead-field-error" id="lead-whatsapp-error" role="alert">
          {errorMessage}
        </span>
      )}

      <CountryPickerSheet
        open={sheetOpen}
        selectedIso={phoneCountry}
        onSelect={selectCountry}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

export function validateLeadWhatsapp(phoneCountry, whatsapp) {
  return isValidNationalPhone(phoneCountry, whatsapp);
}
