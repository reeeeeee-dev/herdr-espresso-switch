# herdr-caffeinate

A Caffeinate button for [Herdr](https://github.com/herdrdev/herdr-app): keep your Mac awake while your agents work.

![Caffeinate button in the Herdr sidebar](preview.png)

It takes the place of the Herdr logo at the top left of the sidebar. Click it and the Mac stops sleeping; the button turns orange and reads **Caffeinated**. Click again and the Mac sleeps as usual. Search and the sidebar toggle stay where they were.

## Requirements

- Herdr 0.1.15 or newer, on macOS (it runs `/usr/bin/caffeinate`)

## Install

Ask your agent to add `github.com/reeeeeee-dev/herdr-caffeinate` to Herdr, or do it by hand:

1. Copy `mods/caffeinate/` to `~/.config/herdr-app/mods/caffeinate/`.
2. In your layout, point the sidebar's `brand` block at the mod. Shipped layouts are rewritten on start, so do this in your own (cloned) layout:

   ```json
   { "id": "brand", "type": "block", "content": { "mod": "caffeinate" }, "size": { "px": 46 }, "window_drag": true }
   ```

3. `herdr-app check ~/.config/herdr-app/mods/caffeinate`

## What it touches

- **Programs:** the mod runs `sh`, which starts or stops `/usr/bin/caffeinate -dims` (no display, idle, disk or system sleep).
- **Files:** one file outside the mod's folder, `~/.config/herdr-app/caffeinate.pid`, naming the process it started.
- **Network:** none.

## Good to know

- The `caffeinate` process is detached, so the Mac stays awake after you close or quit Herdr. Switch it off before you leave, or run `kill $(cat ~/.config/herdr-app/caffeinate.pid)`.
- The button only tracks the `caffeinate` it started. One started elsewhere does not turn the button on and is never killed by it.
- State is re-read every 30 seconds, so a `caffeinate` ended some other way shows as off within that time.
- The orange is fixed (`#f0883e`) and does not follow the theme.

`RECIPE.md` is the brief another agent can rebuild this mod from.
