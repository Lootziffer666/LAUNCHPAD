# VENT — Low-Fidelity Wireframe Pack (Core Screens)

## Zweck

Dieses Dokument beschreibt die Core Screens von VENT als **low-fidelity, mobile-first Wireframes** in Textform. Ziel ist eine direkt umsetzbare Layoutgrundlage für Figma, PRD, Tickets oder Compose-Strukturen.

Notation:

* `[Sticky]` = bleibt oben / unten sichtbar
* `[Scroll]` = Teil der scrollenden Fläche
* `[Conditional]` = nur in bestimmten Zuständen sichtbar
* `(H)` = horizontale Fläche / Rail
* `(V)` = vertikale Fläche / Liste

---

# 1. Home Dashboard

## Wireframe

```text
+--------------------------------------+
¦ [Sticky] Top App Bar                ¦
¦ VENT          Search   Bell   More  ¦
+--------------------------------------¦
¦ [Scroll] Account / Context Header   ¦
¦ Profile / Account                   ¦
¦ Short status line                   ¦
+--------------------------------------¦
¦ [Scroll] Quick Actions Row (H)      ¦
¦ [Compare] [New View] [Invite] [...] ¦
+--------------------------------------¦
¦ [Scroll] Continue / Resume          ¦
¦ +----------------------------------+ ¦
¦ ¦ Last used view / compare / flow ¦ ¦
¦ +----------------------------------+ ¦
+--------------------------------------¦
¦ [Scroll] Wishlist Highlights        ¦
¦ Section Header              [Open]  ¦
¦ +----------------------------------+ ¦
¦ ¦ Game highlight card             ¦ ¦
¦ +----------------------------------+ ¦
¦ +----------------------------------+ ¦
¦ ¦ Game highlight card             ¦ ¦
¦ +----------------------------------+ ¦
+--------------------------------------¦
¦ [Scroll] Families Highlights        ¦
¦ Section Header              [Open]  ¦
¦ +----------------------------------+ ¦
¦ ¦ Family status / issue card      ¦ ¦
¦ +----------------------------------+ ¦
+--------------------------------------¦
¦ [Scroll] Recent Activity Preview    ¦
¦ Section Header              [Open]  ¦
¦ +----------------------------------+ ¦
¦ ¦ Activity row                    ¦ ¦
¦ +----------------------------------+ ¦
¦ +----------------------------------+ ¦
¦ ¦ Activity row                    ¦ ¦
¦ +----------------------------------+ ¦
+--------------------------------------¦
¦ [Scroll][Conditional] Alerts        ¦
¦ +----------------------------------+ ¦
¦ ¦ Warning banner / issue card     ¦ ¦
¦ +----------------------------------+ ¦
+--------------------------------------¦
¦ [Sticky] Bottom Navigation          ¦
¦ Home  Wishlist  Families Activity   ¦
+--------------------------------------+
```

## Layout-Hinweise

* Home ist **eine einzige vertikale Scrollfläche**.
* Top Bar und Bottom Navigation bleiben stabil.
* Alerts erscheinen nur, wenn wirklich relevant.
* Quick Actions dürfen horizontal scrollen, aber nicht dominieren.

---

# 2. Wishlist Overview

## Wireframe

```text
+--------------------------------------+
¦ [Sticky] Top App Bar                ¦
¦ Wishlist      Search   Sort   More  ¦
+--------------------------------------¦
¦ [Sticky] Inline Search Field        ¦
¦ [ Search within wishlist...      ]  ¦
+--------------------------------------¦
¦ [Sticky] Filter / Sort Chips (H)    ¦
¦ [Price] [Coop] [Owned] [Discount]   ¦
¦ [More Filters]                      ¦
+--------------------------------------¦
¦ [Scroll or Semi-Sticky] Views (H)   ¦
¦ [All] [<10€] [Coop] [Friends Own]   ¦
¦ [Add New]                           ¦
+--------------------------------------¦
¦ [Sticky Optional] Result Summary    ¦
¦ 142 results • Sorted by discount    ¦
¦                           [Select]  ¦
+--------------------------------------¦
¦ [Scroll] Wishlist List (V)          ¦
¦ +----------------------------------+ ¦
¦ ¦ Game Row                        ¦ ¦
¦ ¦ Cover | Title | Price | Tags    ¦ ¦
¦ +----------------------------------+ ¦
¦ +----------------------------------+ ¦
¦ ¦ Game Row                        ¦ ¦
¦ +----------------------------------+ ¦
¦ +----------------------------------+ ¦
¦ ¦ Game Row                        ¦ ¦
¦ +----------------------------------+ ¦
+--------------------------------------¦
¦ [Sticky][Conditional] Select Bar    ¦
¦ 3 selected   Compare Add Set Remove ¦
+--------------------------------------¦
¦ [Sticky] Bottom Navigation          ¦
¦ Home  Wishlist  Families Activity   ¦
+--------------------------------------+
```

## Layout-Hinweise

* Search + Filter sind der funktionale Kern und sollten sticky sein.
* Views Rail darf leicht zurücktreten, aber muss schnell erreichbar bleiben.
* Die Liste ist die eigentliche Arbeitsfläche.
* Selection Mode schiebt sich kontextuell vor die normale Ruhe des Screens.

---

# 3. Wishlist Set Detail

## Wireframe

```text
+--------------------------------------+
¦ [Sticky] Top App Bar                ¦
¦ ? Under 10 €            Edit   More ¦
+--------------------------------------¦
¦ [Scroll] Set Header Card            ¦
¦ Name                                ¦
¦ Short explanation / rule summary    ¦
¦ 27 matching games                   ¦
+--------------------------------------¦
¦ [Scroll] Rule Chips (H / wrap)      ¦
¦ [Price <10€] [Discount active]      ¦
+--------------------------------------¦
¦ [Sticky Optional] Action Row        ¦
¦ Sort     Compare     Edit Rules     ¦
+--------------------------------------¦
¦ [Scroll] Results List (V)           ¦
¦ +----------------------------------+ ¦
¦ ¦ Game Row                        ¦ ¦
¦ +----------------------------------+ ¦
¦ +----------------------------------+ ¦
¦ ¦ Game Row                        ¦ ¦
¦ +----------------------------------+ ¦
¦ +----------------------------------+ ¦
¦ ¦ Game Row                        ¦ ¦
¦ +----------------------------------+ ¦
+--------------------------------------¦
¦ [Sticky][Conditional] Select Bar    ¦
¦ 2 selected   Compare Add Set Remove ¦
+--------------------------------------¦
¦ [Sticky] Bottom Navigation          ¦
¦ Home  Wishlist  Families Activity   ¦
+--------------------------------------+
```

## Layout-Hinweise

* Dieser Screen ist fokussierter als Wishlist Overview.
* Die Regel-Logik muss sichtbar bleiben, sonst verliert die View ihren Sinn.
* Resultate dürfen fast identisch zur Wishlist-Liste sein, damit kein Parallel-UI entsteht.

---

# 4. Game Detail

## Wireframe

```text
+--------------------------------------+
¦ [Sticky/Collapsing] Top App Bar     ¦
¦ ? Game Title                 Share ?¦
+--------------------------------------¦
¦ [Scroll] Hero Block                 ¦
¦ +----------------------------------+ ¦
¦ ¦ Cover / Header media            ¦ ¦
¦ +----------------------------------+ ¦
¦ Title                               ¦
¦ Genre • Modes • markers             ¦
+--------------------------------------¦
¦ [Scroll] Action Cluster             ¦
¦ [Wishlist] [Priority] [Compare]     ¦
+--------------------------------------¦
¦ [Scroll] Price & Discount Card      ¦
¦ Current price                        ¦
¦ Discount                            ¦
¦ Price evaluation / historic hint    ¦
+--------------------------------------¦
¦ [Scroll] Ownership / Social Context ¦
¦ Friends own it                      ¦
¦ Family access / shared library      ¦
¦ Match indicators                    ¦
+--------------------------------------¦
¦ [Scroll] Tags / Modes / Compat      ¦
¦ [Coop] [SP] [Controller] [...]      ¦
+--------------------------------------¦
¦ [Scroll] Personal Context Card      ¦
¦ Note                                ¦
¦ Priority reason                     ¦
¦ Saved Views membership              ¦
+--------------------------------------¦
¦ [Scroll] Related / Compare Entry    ¦
¦ Compare with similar / relevant     ¦
+--------------------------------------¦
¦ [Scroll] Extended Metadata          ¦
¦ Description / store-adjacent info   ¦
+--------------------------------------¦
¦ [Sticky] Bottom Navigation          ¦
¦ Home  Wishlist  Families Activity   ¦
+--------------------------------------+
```

## Layout-Hinweise

* Oberhalb des Folds müssen Titel, Medienanker und Hauptaktionen sitzen.
* Preisblock kommt früh, weil er oft die zentrale Entscheidungsbasis ist.
* Detail darf reichhaltig sein, aber nur in klar getrennten Karten.

---

# 5. Families Overview

## Wireframe

```text
+--------------------------------------+
¦ [Sticky] Top App Bar                ¦
¦ Families      Search   Manage   More¦
+--------------------------------------¦
¦ [Scroll] Family Status Hero         ¦
¦ Family healthy / needs attention    ¦
¦ Members • shared library • issues   ¦
¦ [Primary CTA]                       ¦
+--------------------------------------¦
¦ [Scroll] Primary Actions Row (H)    ¦
¦ [Invite] [Manage] [Shared Lib]      ¦
+--------------------------------------¦
¦ [Scroll] Members Section            ¦
¦ Section Header                      ¦
¦ [Member Card] [Member Card] (H/V)   ¦
+--------------------------------------¦
¦ [Scroll] Shared Library Snapshot    ¦
¦ +----------------------------------+ ¦
¦ ¦ Available titles / restrictions ¦ ¦
¦ ¦ Open shared library            ¦ ¦
¦ +----------------------------------+ ¦
+--------------------------------------¦
¦ [Scroll][Conditional] Conflicts     ¦
¦ +----------------------------------+ ¦
¦ ¦ Warning / lock / issue banner   ¦ ¦
¦ +----------------------------------+ ¦
+--------------------------------------¦
¦ [Scroll] Recent Family Activity     ¦
¦ +----------------------------------+ ¦
¦ ¦ Activity Row                    ¦ ¦
¦ +----------------------------------+ ¦
¦ +----------------------------------+ ¦
¦ ¦ Activity Row                    ¦ ¦
¦ +----------------------------------+ ¦
+--------------------------------------¦
¦ [Scroll] Help / Troubleshooting     ¦
¦ Compact entry / disclosure          ¦
+--------------------------------------¦
¦ [Sticky] Bottom Navigation          ¦
¦ Home  Wishlist  Families Activity   ¦
+--------------------------------------+
```

## Layout-Hinweise

* Families braucht einen stark lesbaren Statuskopf.
* Mitglieder und Shared Library sind die zwei wichtigsten Inhaltsblöcke.
* Konflikte nur hochziehen, wenn sie echte Reibung erzeugen.

---

# 6. Family Member Detail

## Wireframe

```text
+--------------------------------------+
¦ [Sticky] Top App Bar                ¦
¦ ? Member Name                 More  ¦
+--------------------------------------¦
¦ [Scroll] Member Header Card         ¦
¦ Avatar                              ¦
¦ Name                                ¦
¦ Role / Status / membership state    ¦
+--------------------------------------¦
¦ [Scroll] Stats / Summary Row        ¦
¦ Shared games | Recent | Overlaps    ¦
+--------------------------------------¦
¦ [Scroll] Intersection Section       ¦
¦ +----------------------------------+ ¦
¦ ¦ Games they own / you want       ¦ ¦
¦ +----------------------------------+ ¦
+--------------------------------------¦
¦ [Scroll] Shared Access Section      ¦
¦ +----------------------------------+ ¦
¦ ¦ Access / sharing relevance      ¦ ¦
¦ +----------------------------------+ ¦
+--------------------------------------¦
¦ [Scroll] Permissions / Restrictions ¦
¦ Toggle / status rows                ¦
¦ Explanation text                    ¦
+--------------------------------------¦
¦ [Scroll] Recent Activity by Member  ¦
¦ +----------------------------------+ ¦
¦ ¦ Activity Row                    ¦ ¦
¦ +----------------------------------+ ¦
+--------------------------------------¦
¦ [Scroll] Actions Section            ¦
¦ [Manage] [Help] [Remove/Leave]      ¦
+--------------------------------------¦
¦ [Sticky] Bottom Navigation          ¦
¦ Home  Wishlist  Families Activity   ¦
+--------------------------------------+
```

## Layout-Hinweise

* Erst Identität und Status, dann Relevanz, dann Verwaltungslogik.
* Permissions dürfen nicht technisch wirken wie Admin-Backend-Müll.
* Überschneidungen sind emotional und praktisch wichtiger als nackte Stammdaten.

---

# 7. Shared Library Detail

## Wireframe

```text
+--------------------------------------+
¦ [Sticky] Top App Bar                ¦
¦ ? Shared Library        Search   ?  ¦
+--------------------------------------¦
¦ [Scroll] Library Summary Header     ¦
¦ Total titles                         ¦
¦ Available now                        ¦
¦ Active restrictions                  ¦
+--------------------------------------¦
¦ [Sticky] Inline Search Field        ¦
¦ [ Search shared library...       ]  ¦
+--------------------------------------¦
¦ [Sticky] Filter / Sort Chips (H)    ¦
¦ [Available] [Locked] [Coop] [Owner] ¦
¦ [Sort]                              ¦
+--------------------------------------¦
¦ [Sticky/Conditional] Conflict Banner¦
¦ Why is this locked?         [Open]  ¦
+--------------------------------------¦
¦ [Scroll] Game List (V)              ¦
¦ +----------------------------------+ ¦
¦ ¦ Shared Library Game Row         ¦ ¦
¦ ¦ Title | Owner | Availability    ¦ ¦
¦ +----------------------------------+ ¦
¦ +----------------------------------+ ¦
¦ ¦ Shared Library Game Row         ¦ ¦
¦ +----------------------------------+ ¦
¦ +----------------------------------+ ¦
¦ ¦ Shared Library Game Row         ¦ ¦
¦ +----------------------------------+ ¦
+--------------------------------------¦
¦ [Conditional] Explanation Trigger   ¦
¦ [Why unavailable?]                  ¦
+--------------------------------------¦
¦ [Sticky] Bottom Navigation          ¦
¦ Home  Wishlist  Families Activity   ¦
+--------------------------------------+
```

## Layout-Hinweise

* Search + Filter sind hier fast so wichtig wie in der Wishlist.
* Restriktionen dürfen nie rein kryptisch wirken.
* Owner-/Availability-Signale müssen extrem scanbar sein.

---

# 8. Screenübergreifende Layout-Bausteine

## A. Standard List Screen Pattern

```text
Top App Bar [Sticky]
Search [Sticky optional]
Filters / Sort [Sticky]
Summary / Mode Row [Optional]
Primary List [Scroll]
Contextual Action Bar [Conditional Sticky]
Bottom Navigation [Sticky]
```

## B. Standard Detail Screen Pattern

```text
Top App Bar [Sticky/Collapsing]
Hero / Identity Block [Scroll]
Primary Actions [Early]
Core Context Cards [Scroll]
Secondary Details [Scroll]
Bottom Navigation [Sticky]
```

## C. State Overlay Pattern

```text
If loading   -> skeleton mirrors target layout
If empty     -> empty state replaces list body
If error     -> error state with retry / explanation
If selection -> action bar overlays bottom area above nav
If sheet open-> current screen remains visible in background
```

---

# 9. Wichtigste Layout-Entscheidungen

## Wishlist / Shared Library

* sticky search/filter mandatory
* list first, decoration second
* quick state reading > rich thumbnail drama

## Home

* curated density
* not a second activity feed
* no section should feel mandatory every time

## Families

* status clarity first
* administrative complexity translated into humane language
* shared relevance before raw management detail

## Game Detail

* decision support before descriptive excess
* price + relevance early
* social/family context is a core differentiator

---

# 10. Direkt ableitbar für die nächste Ebene

Aus diesem Pack lassen sich jetzt ohne Umweg ableiten:

1. **Figma Low-Fi Frames**
2. **Compose Screen Skeletons**
3. **UI PRD Section pro Screen**
4. **Component placement map**
5. **Responsive adaptations for tablet later**

---

# 11. Architektur-Fazit

Diese Wireframes sollen nicht hübsch sein. Sie sollen drei Dinge leisten:

1. **den Screen sofort lesbar machen**
2. **Interaktionen sauber verorten**
3. **Komponenten in eine klare Hierarchie zwingen**

Wenn ein späteres High-Fidelity-Design diese Klarheit verwässert, ist nicht das Wireframe falsch, sondern das spätere Design zu weich geworden.

