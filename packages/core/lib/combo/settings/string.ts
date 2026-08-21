import { isEqual } from 'lodash';
import { deflate, inflate } from 'pako';
import { DEFAULT_SETTINGS, SETTINGS, Settings, makeSettings } from '../settings';
import { PartialDeep } from 'type-fest';

/* Helpers para substituir Buffer */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function exportSettings(settings: Settings): string {
  const diff: any = {};

  /* Normal settings & fallback */
  for (let k in settings) {
    const v = settings[k as keyof typeof settings] as any;
    const data = SETTINGS.find(s => s.key === k);
    if (!data) {
      diff[k] = v;
      continue;
    }

    let def: any = null;
    switch (data.type) {
      case 'set':
        def = { type: data.default };
        break;
      default:
        def = data.default;
        break;
    }

    if (!isEqual(v, def)) {
      diff[k] = v;
    }
  }

  for (const k of ['specialConds', 'dungeon', 'hints', 'junkLocations', 'tricks', 'plando', 'startingItems']) {
    if (isEqual(settings[k as keyof typeof settings], DEFAULT_SETTINGS[k as keyof typeof DEFAULT_SETTINGS])) {
      delete diff[k];
    }
  }

  const j = JSON.stringify(diff);
  const compressed = deflate(j);
  const str = bytesToBase64(compressed);
  return `v1.${str}`;
}

export function importSettingsRaw(str: string): PartialDeep<Settings> {
  let data: any;

  if (str.startsWith('v1.')) {
    data = importSettingsV1(str);
  } else {
    data = importSettingsV0(str);
  }

  return data;
}

export function importSettings(str: string): Settings {
  return makeSettings(importSettingsRaw(str));
}

function importSettingsV1(str: string): any {
  const data = str.slice(3);
  const buf = base64ToBytes(data);
  const decompressed = inflate(buf, { to: 'string' });
  const partial = JSON.parse(decompressed);
  return partial;
}

function importSettingsV0(str: string): any {
  const binary = atob(str);
  const partial = JSON.parse(binary);
  return partial;
}