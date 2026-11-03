# Trev's Session Stopwatch

Version 0.2.0 · Foundry VTT 14 · No dependencies · Any game system

Built by **Billy J Jackson**, with development assistance from **Trev (ChatGPT)**,
an AI assistant. Part of the Trev's collection of small Foundry tools.

## What it does

Tracks real playing time in a GM-only panel. Press **Start** when play begins.
Pausing Foundry pauses the stopwatch. Unpausing resumes a stopwatch you started.
**Stop** saves the total; **Reset** confirms before clearing it. Click the panel
heading to collapse it. No ALIEN code, artwork, or rules are included.

Use it in ALIEN, Blade Runner, Star Trek, or any other Foundry 14 world. Each world
has its own saved total. Enable it separately in each world's Manage Modules.

## Install

1. Close Foundry completely.
2. Copy the **trevs-session-stopwatch** folder into **Data/modules**.
3. Check the path ends **Data/modules/trevs-session-stopwatch/module.json**.
4. Restart Foundry and open your practice world as GM.
5. In **Game Settings → Manage Modules**, enable **Trev's Session Stopwatch**.
6. Save and reload. The timer appears above the hotbar on the left.

Find **Data/modules** inside your own Foundry User Data folder. The path depends
on where you installed Foundry and configured its data storage.

## Upgrade from Trev's GM Session Tools 0.1.0

1. Press **Stop** on the old stopwatch so its exact time is saved.
2. Install this new module folder alongside the old folder.
3. In Manage Modules, **disable Trev's GM Session Tools** and enable
   **Trev's Session Stopwatch**. Save and reload.
4. On the first load, the new module copies the old saved total in that world
   automatically. The old saved data is not changed or deleted. The timer stays
   stopped until you press Start.

The copy happens once per world. A nonzero total already saved in the new module
is never replaced. If you leave the old module enabled, the new stopwatch warns
you and does not start a second timer. You can keep the old module folder
installed but disabled, particularly if old acid markers still use its image.

## Save a dated session log

At the end of play, click **Save session**. This stops the timer and adds a new
page to **Trev's Session Log** in Journals with:

- The date and time when you saved it, using the GM browser's local timezone.
- The stopwatch's playing-time total (paused time excluded).
- The display names of non-GM player accounts connected **when saved**.

This is a snapshot, not attendance history: someone who left before saving will
not be listed, and it does not track individual play time. The journal starts
GM-only; you can change its permissions yourself. No log is created until you
click Save session. Saving the same stopped total twice does not add a duplicate.

Before the next session, press **Reset**, then **Start**. Reset clears the timer,
not previous journal pages. If you resume counting without resetting, your next
log records the cumulative total. Old timer totals transfer, but old dates and
attendance cannot be reconstructed.

## Everyday use

- **Start** while the game is paused arms the timer; unpause to begin counting.
- **Stop** prevents it resuming when you next unpause.
- **Reset** stops it and sets time to zero. Use this for a fresh session total.
- **Press Stop before closing or refreshing Foundry** for an exact save.
- A checkpoint is also saved every 15 seconds. After a refresh, saved time is
  restored and stays stopped. Offline hours are not counted. A crash can lose up
  to 15 seconds since the last checkpoint.
- Leave the GM client open while timing play. With multiple GMs, only Foundry's
  primary connected GM controls it; players do not get a timer panel.

To hide the panel, open **Configure Settings → Trev's Session Stopwatch → Show
session stopwatch**. This is a client setting.

Optional hotbar Script macro to show/hide it:

```js
game.modules.get("trevs-session-stopwatch").api.togglePanel();
```

## Quick check in your world

Start, wait, pause, wait, unpause, then Stop. The paused interval should not count.
Refresh: the stopped total should remain. Click Save session and check its
private journal page, then Reset before your next session. Check another game-system world with
only this module enabled: it should show a timer without any ALIEN markers.

## Sharing and compatibility

Share this module folder or its ZIP independently. It requires Foundry VTT, but
has no subscription, external service, tracking, or other module dependency.
MIT licence: see LICENSE.txt. There is no public update/manifest URL yet; install
manually. Only Foundry 14 is declared supported, not other Foundry editions.

The combined 0.1.0 stopwatch was confirmed working by Billy in Foundry 14.367.
This separated version has passed clock, migration, permissions, and mocked
Foundry-hook tests; it still needs the quick in-world check after installation.
