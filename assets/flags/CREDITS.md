# Flag icons

`*.svg` are Twemoji assets, copied from
https://github.com/twitter/twemoji (release 14.0.2, `assets/svg/`).

- Graphics license: CC-BY 4.0 — © Twitter, Inc. and other Twemoji contributors
  https://creativecommons.org/licenses/by/4.0/
- Why self-hosted: emoji flags render as bare letter pairs on Windows and depend on
  the viewer's font once results are flattened into a share image.

File names follow ISO 3166-1 alpha-2 country codes (`vn.svg` is the Vietnam flag,
codepoint pair `1f1fb-1f1f3`).

**Required post-download patch:** upstream SVGs carry only `viewBox="0 0 36 36"`.
html2canvas measures them as 0x0 and silently drops the flags from the share image,
so each root `<svg>` must keep `width="36" height="36"`. To refresh:

```
curl -o assets/flags/vn.svg https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1fb-1f1f3.svg
# then re-add width="36" height="36" to the root <svg> element
```
