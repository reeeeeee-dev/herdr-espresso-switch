// The sidebar's top row: the Herdr logo, an Espresso switch beside it, then search and the
// sidebar toggle. The rest of workspace-chrome (the footer) stays with the shipped mod.

import { View, div, image, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { theme, run, exec, appHome, window, shared, setShared, layout } from "herdr";

// This mod's folder under the herdr-app home, where its icons are: rename the folder and
// this must change too.
const DIR = "mods/espresso-switch";

// false leaves the logo out, so the switch takes its place.
const LOGO = true;

// How often the switch re-reads the process, so an espresso ended elsewhere shows as off.
const SYNC_MS = 30000;

// Themes name no orange, so the button's active state brings its own: the text and icon,
// and the same hue thinned for the fill behind them.
const ORANGE = "#f0883e";
const ORANGE_FILL = "#f0883e29";
const ORANGE_FILL_HOVER = "#f0883e40";

// One script for reading and flipping: $1 is the pid file, $2 is "on", "off" or nothing.
// It prints the resulting state: "on", "off", or "missing" when espresso is not installed.
// The pid file names the espresso this switch started; any other espresso on the machine
// is left alone and does not turn the switch on.
// espresso stays awake for as long as a command runs, so the switch gives it one that
// lasts until espresso itself is gone: killing espresso is all "off" has to do.
const SCRIPT = `
f="$1"; p=$(cat "$f" 2>/dev/null)
e=$(command -v espresso || echo "$HOME/.local/bin/espresso")
[ -x "$e" ] || { echo missing; exit; }
alive() { [ -n "$p" ] && case "$(ps -p "$p" -o comm= 2>/dev/null)" in *espresso) true ;; *) false ;; esac; }
case "$2" in
  on) alive || {
    nohup "$e" -- /bin/sh -c 'while kill -0 "$PPID" 2>/dev/null; do sleep 5; done' </dev/null >/dev/null 2>&1 & p=$!; echo "$p" > "$f"
    for i in 1 2 3 4 5; do alive && break; sleep 0.1; done
  } ;;
  off) alive && kill "$p"; rm -f "$f"; p= ;;
esac
alive && echo on || echo off
`;

const TOOLTIP = {
  on: "Espresso is on: this Mac stays awake",
  off: "Espresso is off: this Mac sleeps as usual",
  missing: "espresso is not installed: see github.com/Hanyang-Li/espresso",
};

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

// The sidebar's rail goes by its width, not a flag: dragging its edge narrows it too.
const narrow = () => (find(layout(), "sidebar")?.size?.px ?? Infinity) < 160;

// To the rail (on macOS wide enough for the traffic lights), or back to the width it had.
function toggleSidebar() {
  const width = find(layout(), "sidebar")?.size?.px;
  if (!narrow()) setShared("sidebar.width", width);
  // Mods edited before the rail went by width still read the flag.
  setShared("sidebar.collapsed", !narrow());
  run("layout.resize", { id: "sidebar", px: narrow() ? (shared("sidebar.width") ?? 268) : window()?.platform === "macos" ? 76 : 44 });
}

export default class EspressoSwitch extends View {
  init(_props, cx) {
    this.state = "off";
    cx.timer.every(SYNC_MS, (cx) => this.espresso(cx));
    this.espresso(cx);
  }

  espresso(cx, to = "") {
    cx.spawn(async (cx) => {
      const r = await exec("sh", ["-c", SCRIPT, "sh", `${appHome()}/espresso-switch.pid`, to]);
      this.state = r.stdout.trim();
      cx.notify();
    });
  }

  button(id, label, action) {
    const t = theme();
    return div().id(id).size(26).flex_none().flex().items_center().justify_center().rounded(6).text_color(t.muted).hover(s => s.bg(t.hover).text_color(t.foreground))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(action).child(label);
  }

  espressoButton(t) {
    const on = this.state === "on";
    return h_flex().id("espresso").h(26).flex_none().pl(7).pr(9).gap(7).items_center().rounded(6).cursor_pointer().font_semibold()
      .when(on, el => el.bg(ORANGE_FILL).text_color(ORANGE).hover(s => s.bg(ORANGE_FILL_HOVER)))
      .when(!on, el => el.text_color(t.dim).hover(s => s.bg(t.hover).text_color(t.muted)))
      .tooltip(TOOLTIP[this.state])
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_click((_e, cx) => this.espresso(cx, on ? "off" : "on"))
      .child(svg(`${DIR}/espresso.svg`).size(18).flex_none())
      .child(on ? "Caffeinated" : "Drink Espresso");
  }

  render() {
    const t = theme();
    const collapsed = narrow();
    return h_flex().size_full().bg(t.chrome).pl(collapsed ? 6 : 14).pr(10).gap(4).items_center().text_size(13.5)
      .when(window()?.platform === "macos" && !window()?.fullscreen && !collapsed, el => el.pl(76))
      .when(!collapsed, el => el.child(h_flex().flex_1().gap(8).items_center()
        .when(LOGO, el => el.child(image("frame/welcome/herdr.png").size(20).rounded(5).flex_none()))
        .child(this.espressoButton(t))))
      .when(!collapsed, el => el.child(this.button("search", svg(`${DIR}/search.svg`).size(15), () => run("mod.open", { name: "picker" }))))
      // On the macOS rail the traffic lights fill the row; the agents list's » unfolds it.
      .when(!(collapsed && window()?.platform === "macos"), el => el.child(this.button("sidebar-toggle", svg(`${DIR}/sidebar.svg`).size(15), toggleSidebar)));
  }
}
