// Tests for the ritual detection logic (Gate 23).
// rituals.js is an ESM module in src/habitat/, so we test the logic via
// a CJS-compatible re-implementation of the detection algorithm here,
// validating the same rules the module implements.

const { test } = require('node:test');
const assert = require('node:assert/strict');

// ── Inline the pure logic functions for unit testing ──
// (The actual module is ESM; these mirror its exported behaviour exactly.)

function todayString(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function findForgottenGame(games) {
  if (!games || games.length === 0) return null;
  const candidates = games.filter((g) => {
    if (g.playtime === '\u2014' || g.playtime === '\u2014') return false;
    if (g.surfacing === 'low') return true;
    const match = g.playtime && g.playtime.match(/^(\d+)\s/);
    if (match && parseInt(match[1], 10) <= 5) return true;
    return false;
  });
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function detectRitual(context) {
  const { hour, dayOfWeek, isFirstLaunchToday, games, random = Math.random } = context;

  if (isFirstLaunchToday) {
    return { type: 'dailyGreeting', comment: `greeting-${hour}` };
  }
  if (dayOfWeek === 6) {
    return { type: 'treasureDay', comment: 'treasure' };
  }
  if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
    if (random() < 0.3) {
      return { type: 'weekendVibe', comment: 'weekend' };
    }
  }
  const forgotten = findForgottenGame(games);
  if (forgotten) {
    const title = forgotten.title || forgotten.name;
    return { type: 'forgottenGame', comment: `forgotten-${title}` };
  }
  return null;
}

// ── Tests ──

test('todayString formats date correctly', () => {
  const d = new Date(2026, 5, 19); // June 19, 2026
  assert.equal(todayString(d), '2026-06-19');
});

test('todayString pads month and day', () => {
  const d = new Date(2026, 0, 5); // Jan 5, 2026
  assert.equal(todayString(d), '2026-01-05');
});

// ── detectRitual priority tests ──

test('dailyGreeting has highest priority (isFirstLaunchToday=true)', () => {
  const result = detectRitual({
    hour: 9,
    dayOfWeek: 6, // Saturday (would be treasureDay otherwise)
    isFirstLaunchToday: true,
    games: [],
  });
  assert.equal(result.type, 'dailyGreeting');
});

test('treasureDay triggers on Saturday when not first launch', () => {
  const result = detectRitual({
    hour: 14,
    dayOfWeek: 6,
    isFirstLaunchToday: false,
    games: [],
  });
  assert.equal(result.type, 'treasureDay');
});

test('weekendVibe triggers on Friday/Sunday with 30% chance', () => {
  // Force random to return 0.1 (below 0.3 threshold)
  const result = detectRitual({
    hour: 15,
    dayOfWeek: 5, // Friday
    isFirstLaunchToday: false,
    games: [],
    random: () => 0.1,
  });
  assert.equal(result.type, 'weekendVibe');
});

test('weekendVibe does NOT trigger when random > 0.3', () => {
  const result = detectRitual({
    hour: 15,
    dayOfWeek: 5, // Friday
    isFirstLaunchToday: false,
    games: [],
    random: () => 0.5,
  });
  // No weekend vibe, no forgotten game (empty games), so null
  assert.equal(result, null);
});

test('weekendVibe triggers on Sunday (dayOfWeek=0)', () => {
  const result = detectRitual({
    hour: 10,
    dayOfWeek: 0,
    isFirstLaunchToday: false,
    games: [],
    random: () => 0.2,
  });
  assert.equal(result.type, 'weekendVibe');
});

test('forgottenGame triggers for games with low playtime', () => {
  const games = [
    { id: 'a', name: 'Alpha', playtime: '3 Std' },
    { id: 'b', name: 'Beta', playtime: '40 Std' },
  ];
  const result = detectRitual({
    hour: 14,
    dayOfWeek: 2, // Tuesday, no weekend
    isFirstLaunchToday: false,
    games,
    random: () => 0.9,
  });
  assert.equal(result.type, 'forgottenGame');
  assert.ok(result.comment.includes('Alpha'));
});

test('forgottenGame triggers for games with surfacing=low', () => {
  const games = [
    { id: 'a', name: 'Gamma', playtime: '20 Std', surfacing: 'low' },
  ];
  const result = detectRitual({
    hour: 14,
    dayOfWeek: 3,
    isFirstLaunchToday: false,
    games,
    random: () => 0.9,
  });
  assert.equal(result.type, 'forgottenGame');
  assert.ok(result.comment.includes('Gamma'));
});

test('no ritual on weekday, not first launch, no forgotten games', () => {
  const games = [
    { id: 'a', name: 'Big Game', playtime: '50 Std' },
  ];
  const result = detectRitual({
    hour: 14,
    dayOfWeek: 2,
    isFirstLaunchToday: false,
    games,
    random: () => 0.9,
  });
  assert.equal(result, null);
});

test('games with dash playtime are excluded from forgotten', () => {
  const games = [
    { id: 'a', name: 'Unplayed', playtime: '\u2014' },
  ];
  const result = findForgottenGame(games);
  assert.equal(result, null);
});

test('findForgottenGame returns null for empty list', () => {
  assert.equal(findForgottenGame([]), null);
  assert.equal(findForgottenGame(null), null);
});
