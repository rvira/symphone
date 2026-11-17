# Third-party notices

The repository's license covers original Symphone code and documentation, not third-party libraries, sound samples or fonts. Preserve the upstream notices when redistributing those materials. This inventory is not a substitute for reviewing the licenses of a particular release or bundled dependency tree.

## Runtime libraries

| Library           | License                                             | Upstream                               |
| ----------------- | --------------------------------------------------- | -------------------------------------- |
| Next.js           | MIT                                                 | https://github.com/vercel/next.js      |
| React / React DOM | MIT                                                 | https://github.com/facebook/react      |
| Three.js          | MIT                                                 | https://github.com/mrdoob/three.js     |
| smplr, by danigb  | MIT                                                 | https://github.com/danigb/smplr        |
| Lucide React      | ISC; inherited Feather icons also carry MIT notices | https://github.com/lucide-icons/lucide |

Development dependencies have their own licenses; consult the installed packages and `package-lock.json`. Keep dependency license files when distributing a complete installation. Build tools may bundle additional dependencies whose notices must also be retained.

### MIT runtime notices

- Next.js: Copyright (c) 2025 Vercel, Inc.
- React / React DOM: Copyright (c) Meta Platforms, Inc. and affiliates.
- Three.js: Copyright © 2010–2026 three.js authors.
- smplr: authored by danigb; MIT as declared by its package metadata and upstream README.
- Feather-derived Lucide icons: Copyright (c) 2013-present Cole Bemis.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### Lucide ISC notice

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

Lucide's installed `LICENSE` identifies the icons inherited from Feather. Keep that full file with redistributed icon packages; the Feather MIT notice is reproduced above.

## Instrument samples (loaded remotely)

Acoustic voices use **Musyng Kite**, created by **Cose Vidal**, via Benjamin Gleitzman's [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts) collection and smplr. The collection identifies Musyng Kite as [Creative Commons Attribution-ShareAlike 3.0 Unported](https://creativecommons.org/licenses/by-sa/3.0/). The app loads the upstream instrument files without editing the sample assets. No soundfont or sample recordings are included in this repository.

The creator's [original release discussion](https://www.kvraudio.com/forum/viewtopic.php?t=351893) describes an exception for music produced with the soundfont, distinct from modifying samples or creating sample libraries. Consult that upstream statement and license before distributing recordings or repackaging samples; this project does not grant additional rights or claim recordings are covered by its code license.

Retain attribution, upstream license links and any modification notices when redistributing sample assets. Review ShareAlike obligations for modified sample material. Do not assume that the code license relicenses the soundfont.

## Fonts (loaded remotely)

Google Fonts supplies these families under the **SIL Open Font License 1.1**; no font files are checked into this repository:

- **Cinzel** — Copyright 2020 The Cinzel Project Authors. [Upstream notice and license](https://github.com/google/fonts/blob/main/ofl/cinzel/OFL.txt).
- **Cormorant Garamond** — Copyright 2015 the Cormorant Project Authors. [Upstream notice and license](https://github.com/google/fonts/blob/main/ofl/cormorantgaramond/OFL.txt).
- **Plus Jakarta Sans** — Copyright 2020 The Plus Jakarta Sans Project Authors. [Upstream notice and license](https://github.com/google/fonts/blob/main/ofl/plusjakartasans/OFL.txt).

If you self-host or modify fonts, include their full upstream copyright and license files and check reserved-name requirements.

## References and original assets

KHAOS inspired the broad interaction pattern; no KHAOS source is included. Design and orchestration references are listed in [design notes](docs/DESIGN.md) and [crescendo notes](docs/CRESCENDO.md). These are references, not affiliations or endorsements. Symphone's instrument glyphs, stage geometry and favicon are code-authored assets; external photographs and recordings are not bundled.
