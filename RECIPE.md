# Espresso Switch

The top row of Herdr's sidebar with an Espresso switch beside the Herdr logo. One click keeps the Mac awake through [espresso](https://github.com/Hanyang-Li/espresso) and the button turns orange and reads "Caffeinated"; another click lets it sleep again and the button reads "Drink Espresso". Search and the sidebar toggle sit to its right as before.

![Espresso Switch](preview.png)

**What you see**

- **The row** (46px tall, the sidebar's `brand` block, full sidebar width): the theme's `chrome` background, 13.5px text, 14px padding on the left and 10px on the right, 4px gaps. On macOS, outside fullscreen, the left padding is 76px to clear the traffic lights.
- **Logo**: Herdr's own `frame/welcome/herdr.png`, 20px square with 5px corners, at the left, 8px before the switch. The "Herdr" wordmark is gone; the switch has its place. With `LOGO = false` the logo is left out and the switch starts the row.
- **Espresso button** (26px tall, 6px corner radius, 7px left and 9px right padding, semibold): an 18px espresso cup icon (`espresso.svg`), a 7px gap, then the label. The icon is the same in both states; color and label show the state.
  - Off: label "Drink Espresso", icon and label in the theme's `dim` color, no fill. Hover: the theme's `hover` fill and `muted` text.
  - On: label "Caffeinated", icon and label `#f0883e`, on a `#f0883e29` fill. Hover: `#f0883e40`.
- **Search** and **sidebar toggle**: two 26px square buttons with 15px icons in the `muted` color, on the right. Hover: the `hover` fill and `foreground` color.
- **On the narrow sidebar rail** (sidebar under 160px wide): the logo, the Espresso button and search are hidden and the left padding is 6px. Off macOS the sidebar toggle remains; on macOS the row is empty, because the traffic lights fill it.

**How it behaves**

- Clicking the Espresso button flips it. On starts `espresso -- /bin/sh -c 'while kill -0 "$PPID" 2>/dev/null; do sleep 5; done'` detached and writes its pid to `<herdr-app home>/espresso-switch.pid`; off kills that `espresso` and removes the file. The button redraws from what the script reports, not from the click.
- espresso keeps the Mac awake for as long as the command it was given runs. The command given here only waits for espresso itself to go away, so killing `espresso` ends both within five seconds and nothing is left behind.
- The tooltip reads "Espresso is on: this Mac stays awake", "Espresso is off: this Mac sleeps as usual", or, when the `espresso` program is not found, "espresso is not installed: see github.com/Hanyang-Li/espresso".
- State is read when the mod loads and every 30 seconds after, so an `espresso` that ended elsewhere shows as off.
- Only the process named in the pid file counts. An `espresso` started some other way does not turn the button on and is not killed by it. A stale pid (the process is gone, or the pid now belongs to another program) counts as off.
- The process outlives Herdr: quit Herdr with the button on and the Mac stays awake; the button is still on at the next start.
- espresso holds an idle system sleep assertion only. The display can still sleep and lock. With espresso's helper installed (`sudo espresso daemon install`) the same session also keeps the Mac awake with the lid closed; without it, closing the lid sleeps the Mac.
- Search opens the `picker` mod. The sidebar toggle narrows the sidebar to the rail (76px on macOS, 44px elsewhere), remembering its width, or restores it (268px if none was remembered).
- Clicks on the three buttons do not start a window drag; the rest of the row does.
- Agent status plays no part in this mod.

**Built from**

- `mods/espresso-switch/main.js`: one `View`. `mod.json`: `{ "place": "none", "title": "Espresso Switch" }` (plus `cloned_from` `workspace-chrome` 0.1.15, whose brand half this row replaces; the footer stays with the shipped `workspace-chrome`).
- Layout: the sidebar column's first block, `{ "id": "brand", "type": "block", "content": { "mod": "espresso-switch" }, "size": { "px": 46 }, "window_drag": true }`.
- Two constants at the top of `main.js`: `DIR` (`"mods/espresso-switch"`, the folder the icon paths are built from) and `LOGO` (`true`).
- `gpui-kit`: `View`, `div`, `image`, `svg`; `gpui-base`: `h_flex`. `cx.timer.every(30000, ...)` for the re-read, `cx.spawn` around the `exec`, `cx.notify()` after it.
- `herdr` functions: `exec` (`sh -c <script> sh <pid file> <on|off|nothing>`), `appHome` (where the pid file goes), `theme`, `window` (`platform`, `fullscreen`), `layout` (the `sidebar` node's `size.px`), `shared` / `setShared` (`sidebar.width`, `sidebar.collapsed`), `run` (`mod.open {name: "picker"}`, `layout.resize {id: "sidebar", px}`).
- The script, one for reading and flipping: read the pid from the file; find `espresso` on the `PATH`, else `~/.local/bin/espresso`, and print `missing` and stop if neither can be run; "alive" means `ps -p <pid> -o comm=` ends in `espresso`; `on` starts the command above with `nohup` and `</dev/null >/dev/null 2>&1 &`, writes `$!`, and waits up to half a second for the process to show as alive, unless one is alive already; `off` kills it if alive and removes the file; it ends by printing `on` or `off`.
- Art: `espresso.svg` (a small cup with a handle, on a saucer, two lines of steam above), `search.svg`, `sidebar.svg`: 24px stroke icons, 1.5 stroke width, `currentColor`.

**Watch out**

- Apple Silicon macOS only: espresso ships no other build.
- espresso's timer mode (`-t`) needs a real terminal and fails when detached. Use the command mode.
- Killing only `espresso` orphans an ordinary child command such as `sleep`. That is why the child here watches `$PPID` and ends by itself.
- Herdr's `exec` may not have `~/.local/bin` on its `PATH`, which is where espresso's installer puts it. Fall back to that path.
- Start the process with `nohup` and all three streams redirected, or `exec` waits for it and the button never updates.
- Right after it starts, the pid can still name the shell that is about to become `espresso`. Checking once reports off for a session that is on; retry briefly.
- Check the pid's command name, not only that the pid exists: pids are reused.
- With no terminal espresso skips its offer to install the lid-closed helper and prints a note to stderr. That is expected.
- `herdr-app check` runs the mod's `exec` for real. With no third argument the script only reads state, so a check never flips it.
- Themes name no orange, so the on color is fixed at `#f0883e` and does not change with the theme.
- Icon paths are from the herdr-app home (`mods/espresso-switch/espresso.svg`); rename the folder and `DIR` must change too.
- Whether the sidebar is the rail goes by its width (under 160px), not by a flag, because dragging its edge narrows it too. `sidebar.collapsed` is still set for mods that read it.
- Shipped layouts and mods are rewritten on every start: put the block in your own layout and keep this mod in its own folder.
- Built against Herdr 0.1.15 and espresso 1.0.0 on macOS.

**Done when**

- `herdr-app check mods/espresso-switch` passes and `herdr-app status` shows no errors.
- With the button off, `espresso-switch.pid` is absent and the button reads "Drink Espresso" in the dim color. Clicking it makes the button orange and "Caffeinated", `ps -p $(cat ~/.config/herdr-app/espresso-switch.pid) -o comm=` ends in `espresso`, and `pmset -g assertions` lists "espresso session".
- Clicking again kills that process, removes the file, and within five seconds no child of it is left running.
- Killing the process by hand turns the button off within 30 seconds.
- An `espresso` started in a terminal leaves the button off, and switching the button on and off leaves that process running.
- With `espresso` moved away the button stays off and the tooltip says it is not installed.
- Search opens the picker; the sidebar toggle goes to the rail and back to the previous width.
