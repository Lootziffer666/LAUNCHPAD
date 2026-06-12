VENT — Product Requirements Document v1

Status

Draft v1

Product Name

VENT

Working Tagline

Wishlist. Families. Flow.

One-Sentence Summary

VENT is a light-first Android companion for Steam that reduces mobile friction around wishlist management, household/family coordination, account switching, and sale-driven decisions without trying to replace Valve’s official ecosystem.

1. Vision

VENT exists to make Steam on mobile feel guided, organized, and decision-friendly.

Valve provides the ecosystem. Steam provides the flow. VENT acts as the valve’s vent: a layer that directs pressure, reduces friction, and turns scattered mobile interactions into a coherent experience.

VENT is not an alternative Steam client. It is a companion orchestration layer built around three realities:





Steam mobile usage is fragmented across web flows, app flows, account context, and browser detours.



Wishlists are passive, cluttered, and poorly suited to real buying decisions.



Multi-account and family/household use cases create persistent friction that official tools do not fully smooth out.

VENT’s goal is to solve those problems with a focused, elegant Android app that respects official flows while dramatically improving usability.

2. Problem Statement

Steam’s mobile experience contains several long-standing friction points:

2.1 Wishlist friction

Users can save games but cannot meaningfully work through their wishlist at scale. Common pain points include:





no meaningful bulk cleanup workflow



weak organization beyond basic sorting/filtering



poor sale-time prioritization



no personal buying logic such as “buy under X€”



no decision states such as “wait”, “drop”, or “need friends”



no meaningful grouping into real-world buying contexts

2.2 Family / household friction

Steam Families exists, but the practical daily experience for households remains cognitively messy:





multiple users and roles



adult/child contexts



shared library questions



unclear “who owns what” context



request/approval friction



account confusion on mobile

2.3 Account friction

Many users operate more than one Steam account or interact with accounts in different contexts:





main and alt accounts



personal and child accounts



different roles in a household



activation mistakes on the wrong account



lack of fast contextual switching

2.4 Mobile flow fragmentation

Important actions often require switching between app sections, browser pages, or different Valve apps:





wishlist review



sales browsing



activation/redeem flows



family actions



chat or streaming handoffs

The experience works, but it does not flow.

3. Product Principles

3.1 Companion, not replacement

VENT must never rely on pretending to be the official Steam app or fully replacing Steam functionality.

3.2 Safe by design

Sensitive flows such as authentication, payments, account security, and official confirmations should stay in official or clearly delegated flows wherever appropriate.

3.3 Utility over spectacle

VENT should prioritize clarity, speed, and decision quality over flashy “gamer UI” styling.

3.4 Context first

At every moment, the user should understand:





which account is active



what matters right now



what can be acted on now



what should wait

3.5 Batch-friendly interaction

Where Steam is tedious one-by-one, VENT should create efficient, reversible, understandable batch workflows.

3.6 Light-first identity

VENT should be designed for light mode first. Dark mode is supported, but not the design center.

4. Goals

4.1 Primary Goals





Make wishlist management materially more useful and less tedious on mobile.



Make family/household context understandable at a glance.



Make multi-account use fast, explicit, and safe.



Surface sale-relevant decisions instead of forcing passive browsing.



Reduce browser/app switching for recurring Steam tasks.

4.2 Secondary Goals





Provide a structured path for redeem/activate flows.



Create a clean foundation for future inventory, events, and streaming modules.



Build an identity distinct from Valve while feeling ecosystem-compatible.

5. Non-Goals

VENT will not:





replace the Steam client in full



clone official Steam branding or appear official



build a custom payment system



build a custom authenticator/Guard equivalent



function as a market bot or automation-heavy trading tool



depend on fragile full-platform imitation as its main architecture



attempt to replicate every Steam surface in v1

6. Target Users

6.1 Primary Persona: The Wishlist Power User

Characteristics:





has a large wishlist



follows sales regularly



struggles to decide what to buy



wants filters, tags, and cleanup tools



thinks in terms like “under 10€” or “maybe later”

Needs:





cleanup



prioritization



sets



decision states



sale relevance

6.2 Primary Persona: The Household Coordinator

Characteristics:





manages or participates in a family/household setup



cares about child/adult roles



needs clarity about ownership and relevance



wants less confusion between users and accounts

Needs:





family overview



request/approval shortcuts



active account awareness



simple household-oriented views

6.3 Secondary Persona: The Multi-Account User

Characteristics:





uses multiple Steam accounts



wants fast switching



wants to avoid wrong-account actions



wants account-specific shortcuts and context

Needs:





profile switching



clear active-state feedback



account-aware flows

6.4 Secondary Persona: The Sale Opportunist

Characteristics:





uses Steam mainly during sales



wants to quickly identify worthwhile purchases



wants budget-oriented triage

Needs:





under-target-price views



ranking by relevance or discount



quick elimination of low-priority items

7. Core Product Pillars

7.1 Pillar A — Wishlist Intelligence

Turn the Steam wishlist from a passive holding area into an actionable decision system.

v1 scope





bulk selection



bulk remove workflow



tags



decision states



price target per game



manual sets



filtering by on-sale state



sorting by user-relevant decision criteria

later scope





smart sets



scoring/recommendation logic



friend/family ownership influence



stronger sale orchestration

7.2 Pillar B — Families / Household Control

Make household context legible and usable without burying users in Steam’s structure.

v1 scope





household overview



member list



roles/context summary



requests/approvals shortcuts



quick ownership/library context where available

later scope





child-safe mode



household insights



buying recommendations based on household state



stronger per-member relevance views

7.3 Pillar C — Account Flow

Make account context explicit, safe, and fast.

v1 scope





multiple local app profiles



active account indicator



switching UI



account-specific shortcuts



account warning on sensitive actions like activation flow entry

later scope





default account per area



stronger contextual routing



account-specific preferences and modules

7.4 Pillar D — Sales Flow

Help users act during sales instead of drowning in them.

v1 scope





wishlist on sale



under-target-price section



priority candidates section

later scope





budget mode



realism mode



deeper ranking



event/sale participation hub integration

8. Feature Set

8.1 Home

Purpose: a compact decision dashboard.

v1 requirements





show active account card



show key wishlist sale highlights



show family-relevant shortcuts or pending items where available



show continue cards for recent areas



show quick entry points to Wishlist, Families, Sales, Accounts

success criteria

A user opening VENT should know within seconds:





which account is active



whether there is anything worth looking at now



where to go next

8.2 Wishlist

Purpose: decision workspace for game buying.

v1 requirements





list wishlist items in a scannable card/list format



allow multi-select



allow bulk remove workflow



allow assigning tags



allow assigning one decision state per item



allow assigning price target per item



allow adding items to one or more manual sets



allow filtering by sale status



allow filtering by tags / states / sets



allow sorting by discount / price / target hit / priority indicators

v1 wishlist decision states

Suggested initial states:





Hot



Buy if cheap



Wait for deeper sale



Need friends



Research later



Probably never

v1 wishlist tags

Free-form user-defined tags
Examples:





Coop



Singleplayer



Cozy



Story



Deck



For friends



For kid later



Controller first



Short sessions

v1 manual sets

User-created sets, e.g.:





Under 10€ contenders



Winter games



Play with friends



Maybe for child later



Buy next sale

bulk remove flow requirements





selected count visible at all times



explicit confirmation step



progress feedback during execution



success/failure result feedback



failed removals surfaced clearly



user must never feel blind during batch operations

8.3 Families

Purpose: household lens over Steam family context.

v1 requirements





household overview card



members list



role labels (adult/child/etc. where available/known)



request/approval shortcuts



contextual summary of relevant family state



quick navigation to relevant official flows where needed

v1 UX objective

The user should understand “who is in this setup and what matters right now” without hunting through Steam.

8.4 Accounts

Purpose: make multi-account usage legible and low-friction.

v1 requirements





create multiple local account profiles



show profile name, avatar, role label, optional color accent



indicate active profile globally



switch accounts quickly



display shortcut destinations per profile



warn user when entering account-sensitive flows from a possibly wrong profile context

8.5 Sales

Purpose: distill sale relevance.

v1 requirements





show wishlist items currently on sale



show wishlist items at or below target price



show strongest discount candidates



allow entry into affected wishlist items and sets

v1 UX objective

Sales should feel like an actionable shortlist, not a flood.

8.6 Redeem / Activate (stretch for v1, likely v1.5)

Purpose: provide a structured mobile entry point into activation flows.

requirements





separate wallet code vs product key entry points



clipboard assist/paste helper



active account warning



safe handoff into official appropriate flow

9. Information Architecture

v1 top-level navigation





Home



Wishlist



Families



Accounts



Sales



More

“More” in v1

Contains:





Redeem / Activate (if included)



Settings



Help / About



optional future stubs for Inventory, Events, Play

10. Screen Inventory (v1)

10.1 Home





Home Dashboard



Quick Actions Sheet

10.2 Wishlist





Wishlist Overview



Wishlist Filters & Sort



Bulk Actions Bar



Wishlist Item Detail / Actions Sheet



Set Management



Tag Management

10.3 Families





Household Overview



Member Detail / Context



Requests / Approvals Shortcuts Screen

10.4 Accounts





Account Profiles List



Add / Edit Profile



Switcher Sheet



Account Shortcuts View

10.5 Sales





Sale Highlights



Under Target Price



Best Discounts

10.6 More





Redeem / Activate Hub (optional in initial build)



Settings



About / Legal

11. Data Model (Conceptual)

11.1 AccountProfile

Fields:





id



displayName



avatarUrl or local avatar ref



roleLabel



accentColor



isActive



notes



createdAt



updatedAt

11.2 WishlistItem

Fields:





id



steamAppId



title



imageUrl



currentPrice



originalPrice



discountPercent



isOnSale



targetPrice



decisionState



notes



addedAt (if known)



lastSeenAt



accountProfileId

11.3 Tag

Fields:





id



name



color



accountProfileId

11.4 WishlistItemTag

Join model:





wishlistItemId



tagId

11.5 ManualSet

Fields:





id



name



description



accountProfileId

11.6 ManualSetItem

Join model:





manualSetId



wishlistItemId

11.7 FamilyHousehold

Fields:





id



name



sourceContext



notes



accountProfileId

11.8 FamilyMember

Fields:





id



displayName



role



avatarUrl



relationLabel



familyHouseholdId

11.9 Shortcut

Fields:





id



label



destinationType



destinationValue



accountProfileId



priority

12. User Flows

12.1 Cleanup Flow





User opens Wishlist



User filters or scrolls



User enters multi-select mode



User selects unwanted items



User taps Remove



User confirms



VENT executes removal workflow with visible progress



User gets completion summary

12.2 Sale Decision Flow





User opens Home or Sales



User sees “Under target price” or “On sale now”



User enters filtered wishlist view



User compares by discount / tags / state



User updates decision state or set membership



User exits with clearer shortlist

12.3 Household Check Flow





User opens Families



User sees household overview and members



User checks requests/approvals shortcuts



User navigates into relevant official flow if needed

12.4 Account-Sensitive Action Flow





User initiates redeem/activate or related account-sensitive action



VENT surfaces active account context



User confirms or switches profile



VENT hands off safely

13. Functional Requirements

13.1 General





The app must support multiple local account profiles.



The app must maintain a globally visible active account state.



The app must support light mode as primary design baseline.



The app should support dark mode without compromising the light-first system.

13.2 Wishlist





The app must support multi-select on wishlist items.



The app must support batch remove workflow with confirmation.



The app must support user-defined tags.



The app must support manual sets.



The app must support one decision state per wishlist item.



The app must support per-item target price.



The app must support filtering and sorting by user-relevant wishlist properties.

13.3 Families





The app must present a simple household overview.



The app must present members and roles where known.



The app should provide clear navigation to request/approval-related actions.

13.4 Accounts





The app must support creation, editing, and switching of local account profiles.



The app must display active profile status globally.



The app should provide account-context warnings for sensitive flows.

13.5 Sales





The app must provide a sales view filtered down to relevant wishlist items.



The app should surface items at or below target price.

14. Non-Functional Requirements

14.1 Performance





Common list interactions should feel immediate.



Wishlist filtering and sorting should be smooth for large lists.



Batch action state updates must remain responsive and clearly communicated.

14.2 Reliability





Batch actions must surface partial failures clearly.



App state should remain consistent if a workflow is interrupted.



User-added organization data must persist reliably.

14.3 Clarity





Screen hierarchy must be understandable without explanation.



Selection mode must be unmistakable.



The active account must always be obvious.

14.4 Accessibility





Large tap targets



strong contrast in both themes



state not conveyed by color alone



understandable labels for batch actions and decision states

15. Design Requirements

15.1 Design Direction

VENT should feel:





calm



precise



roomy



technically literate



modern



light-first



ecosystem-adjacent, not ecosystem-cloned

15.2 Visual Direction

Inspired by the structural clarity of Steam Air and Steam Metro, but clearly original.

Avoid





direct Steam visual cloning



overly dark “gamer cave” aesthetics



fake-official branding



cramped desktop-style density

Prefer





soft light surfaces



restrained cool accents



crisp cards



excellent information hierarchy



touch-friendly spacing

16. Risk Analysis

16.1 Platform dependency risk

Some parts of the experience depend on Steam web/app/client behavior outside VENT’s control.

Mitigation:





avoid making fragile dependency the only core value



keep clear separation between VENT logic and official handoff logic



build graceful failure states

16.2 Scope explosion risk

Wishlist, families, accounts, sales, inventory, events, and streaming can easily become too broad.

Mitigation:





ship hard MVP focused on wishlist + families + accounts



treat redeem/activate as stretch



defer inventory/events/streaming depth

16.3 User trust risk

If VENT feels deceptive, unofficial in a shady way, or too close to Valve’s branding, trust drops.

Mitigation:





use clearly original branding and UI



be explicit that VENT is a companion layer



use safe handoff patterns

17. Success Metrics

v1 qualitative success





users say VENT makes wishlist cleanup finally tolerable



users understand household/account context faster than in current mobile flows



users perceive sales as actionable rather than overwhelming

v1 quantitative metrics (if instrumented later)





percentage of users who create at least one tag



percentage of users who create at least one manual set



number of batch actions completed successfully



percentage of users with more than one local account profile



return rate during sale periods

18. Release Strategy

v1





Home



Wishlist core



Families core



Accounts core



Sales core



Light mode primary



Dark mode optional if quality is good enough

v1.5





Redeem / Activate hub



expanded filtering



better priority logic

v2





smart sets



score system



deeper sales intelligence



household insights



inventory/event/play foundations

19. Open Questions





How deep should wishlist social context go in the first public version?



Should Redeem / Activate be in v1 or deliberately deferred to v1.5?



Should Families use a purely utilitarian language model or a warmer household-oriented tone?



How aggressively should VENT distinguish “official flow” vs “VENT-only enhancement” in UI copy?



What exact level of Steam web dependency is acceptable for v1 cleanup workflows?

20. Immediate Next Deliverables





Wireframe-level screen map



Component inventory



Data model and state model refinement



UX flows for wishlist bulk operations



Design DNA document (light/dark, colors, spacing, component rules)



MVP implementation plan
