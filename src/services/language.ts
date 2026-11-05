import { EN, ES, FR } from '../enums/languages';
import { KEYS } from '../enums/keys';
import { getLanguageConfig, getPhrase, getTranslations } from './translations';

/**
 * Idioma del juego (código propio, alrededor de la integración oficial de
 * Traducila en `translations.js`, que no se modifica).
 *
 * - Los idiomas válidos salen de `enums/languages.js` (los configurados en Traducila).
 * - Las traducciones se cargan con `getTranslations()` y se espera la respuesta
 *   antes de mostrar textos (`await loadLanguage(...)`).
 * - El español es el idioma base: `getPhrase()` devuelve la propia key.
 */
export const LANGUAGES: readonly string[] = [ES, EN, FR];

const STORAGE_KEY = 'lumo-y-umbra.language';
let current: string = ES;

function isSupported(lang: string | null | undefined): lang is string {
  return typeof lang === 'string' && LANGUAGES.includes(lang);
}

/** Idioma inicial: el elegido antes por el jugador, o el que detecta Traducila (URL / navegador). */
export function initialLanguage(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isSupported(saved)) {
      return saved;
    }
  } catch {
    // sin localStorage: se usa la detección de Traducila
  }
  const detected: unknown = getLanguageConfig();
  return typeof detected === 'string' && isSupported(detected) ? detected : ES;
}

export function currentLanguage(): string {
  return current;
}

/**
 * Carga las traducciones de `lang` y espera a que terminen. Si la API falla,
 * vuelve al español (las keys) para que el juego siga funcionando.
 */
export async function loadLanguage(lang: string): Promise<void> {
  const target = isSupported(lang) ? lang : ES;
  try {
    await getTranslations(target);
    current = target;
  } catch {
    await getTranslations(ES);
    current = ES;
  }
  document.title = getPhrase(KEYS.LUMO_Y_UMBRA);
  try {
    localStorage.setItem(STORAGE_KEY, current);
  } catch {
    // preferencia no guardada; no afecta al juego
  }
}
