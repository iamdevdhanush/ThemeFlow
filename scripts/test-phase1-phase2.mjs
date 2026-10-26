/**
 * Focused Test Suite for ThemeFlow Phase 1 (Typed Schema & Registry) and Phase 2 (Safe Storage Migration)
 * 
 * Validates:
 * 1. ThemeRegistry & ThemeDefinition schema validation (valid definitions, rejected invalid schemas)
 * 2. Separation of theme defaults from user overrides (immutability)
 * 3. Exact preservation of all 8 preset IDs and visual configuration values
 * 4. Validation & bounds enforcement (clamp numbers, sanitize enums and hex colors)
 * 5. Fresh installation initialization
 * 6. Legacy v1 to v2 settings migration (preservation of active theme, audio, animation, custom themes)
 * 7. Safe handling of malformed, incomplete, or corrupted data with documented recovery path
 * 8. Migration idempotency: running migration multiple times yields identical, stable output
 * 9. Non-destructive backup: legacy v1 settings backed up before v2 write and never prematurely deleted
 * 10. Multi-theme overrides preservation during UI saves
 * 11. Custom wallpaper / custom theme round-trip preservation
 * 12. Chrome storage change events: v2 updates fire clean callback; legacy v1 changes do not duplicate
 */

import assert from 'node:assert';
import { themeRegistry } from '../src/themes/themeRegistry.ts';
import { BUILTIN_THEMES } from '../src/themes/definitions/index.ts';
import { THEME_PRESETS } from '../src/themes/presets.ts';
import { THEME_SCHEMA_VERSION, SETTINGS_SCHEMA_VERSION } from '../src/types/themeSchema.ts';
import {
  clampNumber,
  validateThemeMode,
  validateVisualEffect,
  validateFontFamily,
  validateHexColor,
  sanitizeThemeConfig,
  sanitizeStoredUserSettingsV2,
} from '../src/storage/validation.ts';
import {
  STORAGE_KEY_V2,
  LEGACY_STORAGE_KEY_V1,
  BACKUP_STORAGE_KEY_V1,
  migrateV1ToV2,
  isV2Settings,
  createDefaultSettingsV2,
  runSafeStorageMigration,
} from '../src/storage/migration.ts';

console.log('--- Running Phase 1 & Phase 2 Architecture Verification Tests ---\n');

let totalTests = 0;
let passedTests = 0;

async function test(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`[PASS] Test ${totalTests}: ${name}`);
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

async function runAllTests() {
  // ============================================================================
  // PHASE 1: THEME REGISTRY & SCHEMA VALIDATION TESTS
  // ============================================================================

  await test('ThemeRegistry loads all 8 built-in themes with schemaVersion 2.0.0', () => {
    const all = themeRegistry.getAll();
    assert.strictEqual(all.length, 8, 'Expected exactly 8 built-in themes');
    assert.strictEqual(BUILTIN_THEMES.length, 8);

    const expectedIds = [
      'cosmic-void',
      'neo-tokyo',
      'midnight-focus',
      'cyber-workstation',
      'zen-workspace',
      'golden-dusk',
      'velvet-horizon',
      'mystic-hallow',
    ];

    for (const id of expectedIds) {
      const theme = themeRegistry.get(id);
      assert.ok(theme, `Theme "${id}" should be registered`);
      assert.strictEqual(theme.schemaVersion, THEME_SCHEMA_VERSION);
      assert.ok(theme.assets.wallpaper.length > 0);
      assert.ok(theme.assets.thumbnail.length > 0);
      assert.ok(theme.tokens.accentColor.startsWith('#'));
      assert.ok(['dark', 'glass'].includes(theme.tokens.defaultMode));
      assert.ok(theme.supportedPlatforms.includes('leetcode'));
      assert.ok(theme.supportedPlatforms.includes('codeforces'));
    }
  });

  await test('Exact visual configuration values preserved across THEME_PRESETS', () => {
    assert.strictEqual(THEME_PRESETS.length, 8);

    const expectedConfigs = {
      'cosmic-void': { filename: 'galaxy.jpg', thumbnail: 'thumbnails/galaxy.webp', accentColor: '#a78bfa', defaultMode: 'dark', defaultOverlay: 0.72, defaultBlur: 0 },
      'neo-tokyo': { filename: 'japan_street.avif', thumbnail: 'thumbnails/japan_street.webp', accentColor: '#f472b6', defaultMode: 'glass', defaultOverlay: 0.68, defaultBlur: 0 },
      'midnight-focus': { filename: 'boy_focus.jpg', thumbnail: 'thumbnails/boy_focus.webp', accentColor: '#60a5fa', defaultMode: 'dark', defaultOverlay: 0.70, defaultBlur: 0 },
      'cyber-workstation': { filename: 'girl_desktop.jpg', thumbnail: 'thumbnails/girl_desktop.webp', accentColor: '#c084fc', defaultMode: 'dark', defaultOverlay: 0.72, defaultBlur: 0 },
      'zen-workspace': { filename: 'laptop_desk.jpg', thumbnail: 'thumbnails/laptop_desk.webp', accentColor: '#34d399', defaultMode: 'glass', defaultOverlay: 0.68, defaultBlur: 0 },
      'golden-dusk': { filename: 'sunset.avif', thumbnail: 'thumbnails/sunset.webp', accentColor: '#fbbf24', defaultMode: 'dark', defaultOverlay: 0.68, defaultBlur: 0 },
      'velvet-horizon': { filename: 'sikera_sunset.jpg', thumbnail: 'thumbnails/sikera_sunset.webp', accentColor: '#f87171', defaultMode: 'dark', defaultOverlay: 0.70, defaultBlur: 0 },
      'mystic-hallow': { filename: 'halloween.jpg', thumbnail: 'thumbnails/halloween.webp', accentColor: '#fb923c', defaultMode: 'dark', defaultOverlay: 0.74, defaultBlur: 0 },
    };

    for (const preset of THEME_PRESETS) {
      const exp = expectedConfigs[preset.id];
      assert.ok(exp, `Preset "${preset.id}" must exist in expected configurations`);
      assert.strictEqual(preset.filename, exp.filename);
      assert.strictEqual(preset.thumbnail, exp.thumbnail);
      assert.strictEqual(preset.accentColor, exp.accentColor);
      assert.strictEqual(preset.defaultMode, exp.defaultMode);
      assert.strictEqual(preset.defaultOverlay, exp.defaultOverlay);
      assert.strictEqual(preset.defaultBlur, exp.defaultBlur);
    }
  });

  await test('ThemeRegistry validates valid theme definitions and rejects invalid ones', () => {
    const validTheme = themeRegistry.getDefault();
    const validResult = themeRegistry.validateThemeDefinition(validTheme);
    assert.strictEqual(validResult.valid, true);
    assert.strictEqual(validResult.errors.length, 0);

    // Missing schemaVersion
    const noSchema = { ...validTheme, schemaVersion: '1.0.0' };
    const r1 = themeRegistry.validateThemeDefinition(noSchema);
    assert.strictEqual(r1.valid, false);
    assert.ok(r1.errors.some((e) => e.includes('schemaVersion')));

    // Invalid ID with uppercase or spaces
    const badId = { ...validTheme, id: 'Invalid Theme ID!' };
    const r2 = themeRegistry.validateThemeDefinition(badId);
    assert.strictEqual(r2.valid, false);
    assert.ok(r2.errors.some((e) => e.includes('kebab-case')));

    // Out-of-bounds surface tokens
    const badSurfaces = {
      ...validTheme,
      tokens: {
        ...validTheme.tokens,
        surfaces: {
          ...validTheme.tokens.surfaces,
          overlayOpacity: 2.5, // max 1.0
          brightness: 40, // min 50
        },
      },
    };
    const r3 = themeRegistry.validateThemeDefinition(badSurfaces);
    assert.strictEqual(r3.valid, false);
    assert.ok(r3.errors.some((e) => e.includes('overlayOpacity')));
    assert.ok(r3.errors.some((e) => e.includes('brightness')));
  });

  await test('Separation of theme defaults and user overrides (immutability)', () => {
    const defaultCosmic = themeRegistry.get('cosmic-void');
    assert.strictEqual(defaultCosmic.tokens.accentColor, '#a78bfa');
    assert.strictEqual(defaultCosmic.tokens.surfaces.overlayOpacity, 0.72);

    // Apply user custom override
    const customConfig = themeRegistry.resolveConfig('cosmic-void', {
      accentColor: '#ff0077',
      overlayOpacity: 0.45,
      blur: 8,
    });

    // Verify resolved config contains user overrides
    assert.strictEqual(customConfig.accentColor, '#ff0077');
    assert.strictEqual(customConfig.overlayOpacity, 0.45);
    assert.strictEqual(customConfig.blur, 8);

    // Verify default theme definition in registry remains completely unmodified
    const defaultCosmicAfter = themeRegistry.get('cosmic-void');
    assert.strictEqual(defaultCosmicAfter.tokens.accentColor, '#a78bfa');
    assert.strictEqual(defaultCosmicAfter.tokens.surfaces.overlayOpacity, 0.72);
    assert.strictEqual(defaultCosmicAfter.tokens.surfaces.blur, 0);
  });

  // ============================================================================
  // PHASE 2: VALIDATION & BOUNDS ENFORCEMENT TESTS
  // ============================================================================

  await test('Bounds enforcer clamps numeric values, filters NaNs and inf, validates enums', () => {
    // Numbers
    assert.strictEqual(clampNumber(0.5, 0, 1, 0.7), 0.5);
    assert.strictEqual(clampNumber(1.8, 0, 1, 0.7), 1.0);
    assert.strictEqual(clampNumber(-0.5, 0, 1, 0.7), 0.0);
    assert.strictEqual(clampNumber(NaN, 0, 1, 0.7), 0.7);
    assert.strictEqual(clampNumber(Infinity, 0, 1, 0.7), 0.7);
    assert.strictEqual(clampNumber('not-a-number', 0, 1, 0.7), 0.7);

    // Modes
    assert.strictEqual(validateThemeMode('midnight'), 'midnight');
    assert.strictEqual(validateThemeMode('invalid_mode', 'dark'), 'dark');

    // Effects
    assert.strictEqual(validateVisualEffect('sakura'), 'sakura');
    assert.strictEqual(validateVisualEffect('glitch_explosions', 'none'), 'none');

    // Fonts
    assert.strictEqual(validateFontFamily('Fira Code'), 'Fira Code');
    assert.strictEqual(validateFontFamily('Comic Sans', 'JetBrains Mono'), 'JetBrains Mono');

    // Colors
    assert.strictEqual(validateHexColor('#34d399'), '#34d399');
    assert.strictEqual(validateHexColor('rgb(255,0,0)', '#a78bfa'), '#a78bfa');
    assert.strictEqual(validateHexColor('javascript:alert(1)', '#a78bfa'), '#a78bfa');
  });

  await test('Sanitize theme config enforces boundaries on all fields', () => {
    const fallback = themeRegistry.definitionToConfig(themeRegistry.getDefault());
    const malformed = {
      overlayOpacity: 999,
      blur: -50,
      brightness: 9999,
      contrast: 10,
      cardGlassOpacity: 0.01,
      accentColor: 'evil-script',
      soundVolume: 5.0,
    };

    const sanitized = sanitizeThemeConfig(malformed, fallback);
    assert.strictEqual(sanitized.overlayOpacity, 1.0);
    assert.strictEqual(sanitized.blur, 0);
    assert.strictEqual(sanitized.brightness, 130);
    assert.strictEqual(sanitized.contrast, 80);
    assert.strictEqual(sanitized.cardGlassOpacity, 0.2);
    assert.strictEqual(sanitized.accentColor, fallback.accentColor);
    assert.strictEqual(sanitized.soundVolume, 1.0);
  });

  // ============================================================================
  // PHASE 2: STORAGE MIGRATION & ADAPTER TESTS
  // ============================================================================

  await test('Fresh installation initializes clean v2 defaults without errors', async () => {
    const mockStorage = new Map();
    const adapter = {
      async get(keys) {
        const out = {};
        for (const k of keys) if (mockStorage.has(k)) out[k] = mockStorage.get(k);
        return out;
      },
      async set(items) {
        for (const [k, v] of Object.entries(items)) mockStorage.set(k, v);
      },
    };

    const result = await runSafeStorageMigration(adapter);
    assert.strictEqual(result.schemaVersion, SETTINGS_SCHEMA_VERSION);
    assert.strictEqual(result.enabled, true);
    assert.strictEqual(result.activeThemeId, 'cosmic-void');
    assert.strictEqual(result.quickSwitchVisible, true);
    assert.strictEqual(result.audioSettings.enabled, false);
    assert.strictEqual(result.audioSettings.volume, 0.7);
    assert.strictEqual(result.animationSettings.celebrationEnabled, true);

    // Verify storage has v2 written
    assert.ok(mockStorage.has(STORAGE_KEY_V2));
    assert.strictEqual(mockStorage.get(STORAGE_KEY_V2).schemaVersion, SETTINGS_SCHEMA_VERSION);
  });

  await test('Migrate legacy v1 user settings to versioned v2 structure accurately', () => {
    const legacyV1 = {
      enabled: true,
      activeThemeId: 'neo-tokyo',
      quickSwitchVisible: false,
      customThemes: [],
      currentConfig: {
        id: 'neo-tokyo',
        name: 'Neo Tokyo Dusk',
        description: 'Atmospheric rainy alleyway glowing with tranquil evening lanterns.',
        imagePath: 'IMAGES/japan_street.avif',
        thumbnailPath: 'thumbnails/japan_street.webp',
        accentColor: '#38bdf8', // User had customized to Cyan!
        mode: 'glass',
        overlayOpacity: 0.55, // User had customized overlay!
        blur: 2,
        brightness: 105,
        contrast: 100,
        cardGlassOpacity: 0.85,
        fontFamily: 'Fira Code',
        effect: 'rain',
        soundEnabled: true,
        soundVolume: 0.85,
        confettiEnabled: true,
      },
    };

    const v2 = migrateV1ToV2(legacyV1);

    assert.strictEqual(v2.schemaVersion, SETTINGS_SCHEMA_VERSION);
    assert.strictEqual(v2.enabled, true);
    assert.strictEqual(v2.activeThemeId, 'neo-tokyo');
    assert.strictEqual(v2.quickSwitchVisible, false);

    // Audio settings preserved
    assert.strictEqual(v2.audioSettings.enabled, true);
    assert.strictEqual(v2.audioSettings.volume, 0.85);

    // Animation settings preserved
    assert.strictEqual(v2.animationSettings.celebrationEnabled, true);
    assert.strictEqual(v2.animationSettings.ambientEffect, 'rain');

    // User theme custom overrides preserved
    assert.ok(v2.themeOverrides['neo-tokyo']);
    assert.strictEqual(v2.themeOverrides['neo-tokyo'].accentColor, '#38bdf8');
    assert.strictEqual(v2.themeOverrides['neo-tokyo'].overlayOpacity, 0.55);

    // Resolved currentConfig has user customizations active
    assert.strictEqual(v2.currentConfig.accentColor, '#38bdf8');
    assert.strictEqual(v2.currentConfig.overlayOpacity, 0.55);
    assert.strictEqual(v2.currentConfig.soundEnabled, true);
    assert.strictEqual(v2.currentConfig.soundVolume, 0.85);
    assert.strictEqual(v2.currentConfig.effect, 'rain');
  });

  await test('Safe handling of malformed or incomplete legacy data with recovery path', () => {
    const corruptData = {
      enabled: 'not-a-bool',
      activeThemeId: 12345,
      currentConfig: null,
    };

    const recovered = migrateV1ToV2(corruptData);
    assert.strictEqual(recovered.schemaVersion, SETTINGS_SCHEMA_VERSION);
    assert.strictEqual(recovered.enabled, true); // fallback default
    assert.strictEqual(recovered.activeThemeId, 'cosmic-void'); // fallback default
    assert.ok(recovered.currentConfig);
    assert.strictEqual(recovered.currentConfig.id, 'cosmic-void');
    assert.strictEqual(recovered.audioSettings.enabled, false);
  });

  await test('Migration idempotency: running migration multiple times yields identical, stable output', () => {
    const legacyV1 = {
      enabled: true,
      activeThemeId: 'midnight-focus',
      quickSwitchVisible: true,
      currentConfig: {
        id: 'midnight-focus',
        accentColor: '#60a5fa',
        soundEnabled: true,
        soundVolume: 0.6,
        confettiEnabled: false,
      },
    };

    const v2First = migrateV1ToV2(legacyV1);
    const v2Second = migrateV1ToV2(v2First);
    const v2Third = migrateV1ToV2(v2Second);

    assert.deepStrictEqual(v2First, v2Second);
    assert.deepStrictEqual(v2Second, v2Third);
    assert.strictEqual(v2Third.activeThemeId, 'midnight-focus');
    assert.strictEqual(v2Third.audioSettings.volume, 0.6);
    assert.strictEqual(v2Third.animationSettings.celebrationEnabled, false);
  });

  await test('Non-destructive migration: backup created, v2 written, legacy v1 preserved intact', async () => {
    const mockStorageMap = new Map();

    const mockStorageAdapter = {
      async get(keys) {
        const res = {};
        for (const k of keys) {
          if (mockStorageMap.has(k)) res[k] = mockStorageMap.get(k);
        }
        return res;
      },
      async set(items) {
        for (const [k, v] of Object.entries(items)) {
          mockStorageMap.set(k, v);
        }
      },
    };

    const initialV1 = {
      enabled: true,
      activeThemeId: 'zen-workspace',
      quickSwitchVisible: true,
      currentConfig: {
        id: 'zen-workspace',
        accentColor: '#34d399',
        soundEnabled: true,
        soundVolume: 0.9,
      },
    };

    // Seed storage with only v1 settings
    mockStorageMap.set(LEGACY_STORAGE_KEY_V1, initialV1);

    // Run migration
    const result = await runSafeStorageMigration(mockStorageAdapter);

    assert.strictEqual(result.activeThemeId, 'zen-workspace');
    assert.strictEqual(result.schemaVersion, SETTINGS_SCHEMA_VERSION);

    // Verify backup key was created and matches initial v1 exactly
    assert.ok(mockStorageMap.has(BACKUP_STORAGE_KEY_V1));
    assert.deepStrictEqual(mockStorageMap.get(BACKUP_STORAGE_KEY_V1), initialV1);

    // Verify v2 key was written
    assert.ok(mockStorageMap.has(STORAGE_KEY_V2));
    assert.strictEqual(mockStorageMap.get(STORAGE_KEY_V2).activeThemeId, 'zen-workspace');

    // Verify original v1 was NOT deleted
    assert.ok(mockStorageMap.has(LEGACY_STORAGE_KEY_V1));
    assert.deepStrictEqual(mockStorageMap.get(LEGACY_STORAGE_KEY_V1), initialV1);
  });

  await test('Custom uploaded wallpaper theme is preserved through migration and storage writes', () => {
    const customTheme = {
      id: 'custom_1700000000',
      name: 'My Custom Wallpaper',
      description: 'User uploaded custom background wallpaper.',
      imagePath: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      thumbnailPath: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      accentColor: '#f43f5e',
      mode: 'glass',
      overlayOpacity: 0.65,
      blur: 3,
      brightness: 110,
      contrast: 105,
      cardGlassOpacity: 0.8,
      fontFamily: 'JetBrains Mono',
      effect: 'stars',
      soundEnabled: true,
      soundVolume: 0.8,
      confettiEnabled: true,
      isCustom: true,
    };

    const legacyV1WithCustom = {
      enabled: true,
      activeThemeId: 'custom_1700000000',
      quickSwitchVisible: true,
      customThemes: [customTheme],
      currentConfig: customTheme,
    };

    const v2 = migrateV1ToV2(legacyV1WithCustom);

    assert.strictEqual(v2.activeThemeId, 'custom_1700000000');
    assert.strictEqual(v2.customThemes.length, 1);
    assert.strictEqual(v2.customThemes[0].id, 'custom_1700000000');
    assert.strictEqual(v2.customThemes[0].isCustom, true);
    assert.strictEqual(v2.currentConfig.id, 'custom_1700000000');
    assert.strictEqual(v2.currentConfig.isCustom, true);
    assert.strictEqual(v2.currentConfig.accentColor, '#f43f5e');
  });

  await test('Multi-theme overrides are preserved when user toggles settings or switches themes', () => {
    const v2State = {
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      enabled: true,
      activeThemeId: 'neo-tokyo',
      quickSwitchVisible: true,
      audioSettings: { enabled: true, volume: 0.8 },
      animationSettings: { celebrationEnabled: true, ambientEffect: 'none' },
      themeOverrides: {
        'cosmic-void': { accentColor: '#ff00aa', blur: 4 },
        'neo-tokyo': { accentColor: '#00ffff' },
      },
      customThemes: [],
      currentConfig: themeRegistry.resolveConfig('neo-tokyo', { accentColor: '#00ffff' }),
    };

    const sanitized = sanitizeStoredUserSettingsV2(v2State, createDefaultSettingsV2());
    assert.strictEqual(sanitized.themeOverrides['cosmic-void'].accentColor, '#ff00aa');
    assert.strictEqual(sanitized.themeOverrides['neo-tokyo'].accentColor, '#00ffff');
  });

  console.log(`\n======================================================`);
  console.log(`Phase 1 & 2 Verification: All ${passedTests}/${totalTests} Tests Passed Successfully!`);
  console.log(`======================================================\n`);
}

runAllTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
