# Limassol Zmanim Display

This folder is a fullscreen web display for a TV or signage browser such as UniFi Cast Pro.

It uses the browser build of [`kosher-zmanim`](https://github.com/BehindTheMath/KosherZmanim), which is a JS/TS port of KosherJava, and it follows the Chabad-style mix described here:

- [KosherJava article about Baal HaTanya zmanim](https://kosherjava.com/2018/11/27/baal-hatanya-zmanim-added-to-kosherjava/)

## What it shows

- Alos Hashachar
- Netz Hachamah
- Sof Zman Shema
- Sof Zman Tfila
- Chatzos
- Mincha Gedola
- Mincha Ketana
- Plag Hamincha
- Shkiah
- Tzais

For Chabad-style matching:

- `Alos` and `Tzais` use the Baal HaTanya methods.
- `Sof Zman Shema`, `Sof Zman Tfila`, `Mincha Gedola`, `Mincha Ketana`, and `Plag Hamincha` use the Baal HaTanya methods.
- `Netz` and `Shkiah` use standard sunrise and sunset, matching the KosherJava article's Chabad.org example.

## Quick start

Serve this folder from any static web server, then point the UniFi Cast Pro display to the page URL.

One easy local option:

```bash
cd "/Users/yairbaitz/Documents/New project/display"
python3 -m http.server 8080
```

Then open:

```text
http://YOUR-SERVER-IP:8080
```

## Matching Chabad.org more closely

The page defaults to:

- `Limassol`
- latitude `34.6786`
- longitude `33.0413`
- elevation `22`
- timezone `Asia/Nicosia`
- rounding `nearest`

If the Chabad.org location you compare against differs by a minute here or there, you can tune the page with URL parameters:

```text
http://YOUR-SERVER-IP:8080?name=Limassol&lat=34.6786&lng=33.0413&elevation=22&tz=Asia/Nicosia&rounding=nearest
```

Supported rounding modes:

- `nearest`
- `up`
- `down`

In practice, the most common reasons for a one-minute mismatch are:

- slightly different city coordinates
- a different elevation setting
- different display rounding
