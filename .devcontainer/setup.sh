#!/usr/bin/env bash
# Codespaces / devcontainer setup for building the LAUNCHPAD desktop installers.
#
# electron-builder produces the Windows NSIS .exe on Linux by running makensis
# through Wine, so we install Wine here. (MSIX/APPX still needs Windows — use the
# GitHub Actions windows-latest workflow for that.) Best-effort: if Wine can't be
# installed, the unpacked build + tests still work.
set -uo pipefail

echo "==> Installing Wine (needed for the NSIS .exe build on Linux)"
sudo dpkg --add-architecture i386 || true
sudo apt-get update -y || true
# Debian/Ubuntu package names vary; try the common sets, keep going on failure.
sudo apt-get install -y --no-install-recommends wine64 wine32 \
  || sudo apt-get install -y --no-install-recommends wine \
  || echo "WARN: Wine install failed — 'npm run dist:win' won't work, but tests/build/pack will."

echo "==> Installing desktop dependencies"
( cd desktop && npm install )

cat <<'EOF'

✅ Ready.

  cd desktop
  npm test            # 61 unit tests
  npm run build       # renderer (Vite)
  npm run pack:win    # unpacked PE32+ build (no Wine needed)
  npm run dist:win    # NSIS .exe installer  (needs Wine — installed above)

  MSIX / MS Store package (npm run dist:msix) must be built on Windows
  (GitHub Actions: .github/workflows/desktop-installers.yml).
EOF
