export type PriceState = 'under' | 'near' | 'above';

export type DecisionState =
  | 'hot'
  | 'buy_cheap'
  | 'wait'
  | 'need_friends'
  | 'research'
  | 'skip'
  | null;

export const DECISION_STATE_LABELS: Record<NonNullable<DecisionState>, string> = {
  hot: '🔥 Hot',
  buy_cheap: '💸 Buy if cheap',
  wait: '⏳ Wait for sale',
  need_friends: '👥 Need friends',
  research: '🔍 Research later',
  skip: '🗑️ Probably never',
};

export interface ManualSet {
  id: string;
  name: string;
  gameIds: string[];
}

export interface AccountProfile {
  id: string;
  displayName: string;
  steamId?: string;
  avatarUrl?: string;
  roleLabel?: string;
  accentColor: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface Game {
  id: string;
  title: string;
  developer: string;
  publisher?: string;
  releaseDate?: string;
  description?: string;
  meta: string;
  coverUrl: string;
  price: string;
  originalPrice?: string;
  targetPrice?: string;
  discount?: string | null;
  statusState?: PriceState;
  reason: string;
  tags: string[];
  decisionState?: DecisionState;
  compatibility?: string;
  familyOwnedCount: number;
  ownedBy: string[];
  rating?: string;
  isInstalled?: boolean;
  hasUpdate?: boolean;
  isShared?: boolean;
  sharedBy?: string;
  // CheapShark enrichment
  cheapestPrice?: string;
  historicalLow?: string;
  isOnSale?: boolean;
}

export interface FamilyConflict {
  id: string;
  gameTitle: string;
  blockedBy: string;
  reason: string; // e.g. "Alle Slots belegt", "In Benutzung"
  severity: 'warning' | 'danger';
  wasSessionInterrupted?: boolean; // true if another member's active session was cut short
}

export const DEFAULT_ACCOUNT_PROFILES: AccountProfile[] = [
  {
    id: 'profile-1',
    displayName: 'Commander Max',
    steamId: '76561198000000000',
    roleLabel: 'Hauptkonto',
    accentColor: '#4FB0E5',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

export const ALL_GAMES: Game[] = [
  {
    id: '1036800',
    title: 'Hollow Knight: Silksong',
    developer: 'Team Cherry',
    meta: 'Action-Platformer • Team Cherry',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1036800/header.jpg',
    price: '29,99€',
    targetPrice: '15,00€',
    discount: null,
    statusState: 'above',
    reason: 'Warten auf Release',
    tags: ['Hot', 'Wishlist'],
    decisionState: 'hot',
    compatibility: 'Verified',
    familyOwnedCount: 0,
    ownedBy: [],
    rating: '98%',
    description: 'Hollow Knight: Silksong is the epic sequel to Hollow Knight, the award-winning action-adventure of bugs and heroes.',
  },
  {
    id: '1091500',
    title: 'Cyberpunk 2077',
    developer: 'CD PROJEKT RED',
    meta: 'RPG • CD PROJEKT RED',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg',
    price: '29,99€',
    originalPrice: '59,99€',
    targetPrice: '25,00€',
    discount: '-50%',
    statusState: 'near',
    reason: 'Knapp über Zielpreis',
    tags: ['Angebote', 'Wishlist'],
    decisionState: 'buy_cheap',
    compatibility: 'Verified',
    familyOwnedCount: 5,
    ownedBy: ['Max', 'Julia', 'Lukas', 'Sarah', 'Tim'],
    rating: '92%',
    description: 'Cyberpunk 2077 is an open-world, action-adventure RPG set in the megalopolis of Night City.',
  },
  {
    id: '413150',
    title: 'Stardew Valley',
    developer: 'ConcernedApe',
    meta: 'Farming • ConcernedApe',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/413150/header.jpg',
    price: '9,99€',
    targetPrice: '10,00€',
    discount: '-30%',
    statusState: 'under',
    reason: 'Zielpreis erreicht!',
    tags: ['Angebote', 'Erreichte Ziele', 'Wishlist'],
    decisionState: 'hot',
    compatibility: 'Verified',
    familyOwnedCount: 2,
    ownedBy: ['Max', 'Lukas'],
    rating: '99%',
    description: 'You\'ve inherited your grandfather\'s old farm plot in Stardew Valley.',
    isOnSale: true,
  },
  {
    id: '1245620',
    title: 'Elden Ring',
    developer: 'FromSoftware',
    meta: 'Action-RPG • FromSoftware',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg',
    price: '59,99€',
    targetPrice: '40,00€',
    discount: null,
    statusState: 'above',
    reason: 'Family Overlap',
    tags: ['Family Overlap', 'Library'],
    decisionState: 'wait',
    compatibility: 'Verified',
    familyOwnedCount: 1,
    ownedBy: ['Max'],
    rating: '95%',
    isInstalled: true,
    description: 'Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring.',
  },
  {
    id: '730',
    title: 'Counter-Strike 2',
    developer: 'Valve',
    meta: 'Shooter • Valve',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg',
    price: 'Kostenlos',
    reason: 'Häufig gespielt',
    tags: ['Library'],
    compatibility: 'Playable',
    familyOwnedCount: 3,
    ownedBy: ['Max', 'Julia', 'Lukas'],
    rating: '88%',
    isInstalled: true,
    hasUpdate: true,
  },
  {
    id: '620',
    title: 'Portal 2',
    developer: 'Valve',
    meta: 'Puzzle • Valve',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/620/header.jpg',
    price: '9,75€',
    reason: 'Koop-Chance',
    tags: ['Library', 'Shared'],
    compatibility: 'Verified',
    familyOwnedCount: 2,
    ownedBy: ['Max', 'Julia'],
    rating: '99%',
    isShared: true,
    sharedBy: 'Max',
  },
  {
    id: '1174180',
    title: 'Red Dead Redemption 2',
    developer: 'Rockstar Games',
    meta: 'Action-Adventure • Rockstar',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg',
    price: '59,99€',
    originalPrice: '59,99€',
    targetPrice: '20,00€',
    discount: null,
    statusState: 'above',
    reason: 'Auf günstigen Sale warten',
    tags: ['Wishlist'],
    decisionState: 'wait',
    compatibility: 'Verified',
    familyOwnedCount: 0,
    ownedBy: [],
    rating: '91%',
    description: 'America, 1899. The end of the wild west era has begun. After a robbery goes badly wrong, outlaw Arthur Morgan flees.',
  },
  {
    id: '1086940',
    title: 'Baldur\'s Gate 3',
    developer: 'Larian Studios',
    meta: 'RPG • Larian Studios',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg',
    price: '59,99€',
    originalPrice: '59,99€',
    targetPrice: '35,00€',
    discount: null,
    statusState: 'above',
    reason: 'Brauche Freunde fürs Koop',
    tags: ['Wishlist'],
    decisionState: 'need_friends',
    compatibility: 'Verified',
    familyOwnedCount: 1,
    ownedBy: ['Julia'],
    rating: '97%',
    description: 'Gather your party and return to the Forgotten Realms in a tale of fellowship and betrayal, sacrifice and survival.',
  },
];

export interface FamilyMember {
  id: string;
  name: string;
  role: 'Administrator' | 'Erwachsener' | 'Kind';
  status: 'Online' | 'Offline' | 'Abwesend';
  activity: string;
  color: string;
  isCurrentSessionOccupied?: boolean;
}

export const FAMILY_MEMBERS: FamilyMember[] = [
  { id: 'm1', name: 'Max (Du)', role: 'Administrator', status: 'Online', activity: 'Spielt: Helldivers 2', color: '#4FB0E5', isCurrentSessionOccupied: true },
  { id: 'm2', name: 'Julia', role: 'Erwachsener', status: 'Online', activity: 'Bereit für Coop', color: '#FF7A59' },
  { id: 'm3', name: 'Lukas', role: 'Kind', status: 'Offline', activity: 'Zuletzt vor 2h: Portal 2', color: '#2BB673' },
];

export const MOCK_CONFLICTS: FamilyConflict[] = [
  { id: 'c1', gameTitle: 'Helldivers 2', blockedBy: 'Max', reason: 'Alle Slots belegt', severity: 'warning', wasSessionInterrupted: false }
];

export const ACTIVITY_LOG = [
  { id: 'a1', gameId: '1091500', title: 'Preisalarm', desc: 'Cyberpunk 2077 ist jetzt 60% günstiger.', time: 'Vor 10 Min', type: 'price' },
  { id: 'a2', gameId: '367520', title: 'Bibliothek Update', desc: 'Max hat Helldivers 2 zur Family Library hinzugefügt.', time: 'Vor 1h', type: 'family' },
  { id: 'a3', title: 'System', desc: 'Dein Steam-Konto wurde erfolgreich synchronisiert.', time: 'Vor 3h', type: 'system' },
  { id: 'a4', gameId: '1036800', title: 'Wunschliste', desc: 'Hollow Knight: Silksong hat neue Shop-Assets erhalten.', time: 'Gestern', type: 'wishlist' },
];


