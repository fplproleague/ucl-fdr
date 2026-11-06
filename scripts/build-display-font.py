"""The site's display face: Archivo Expanded, as two small subset files.

Titles and section labels use Archivo's width axis at 118. Loading the
variable file that has a width axis cost 90 kB (latin) against 35 kB for
the weight-only file the body text needs, for a few dozen headings. This
cuts that axis down to one static width (wdth 118), keeps weight variable
from 600 to 800 (the two weights the display text uses), and keeps only the
characters headings use: Basic Latin, Latin-1 and some punctuation in one
file (~19 kB), Latin Extended-A (Milinković, Łódź…) in a second one that
the browser only fetches when such a name is on screen (unicode-range in
src/index.css).

Run it again only if the Archivo package is upgraded:
  python3 -m venv /tmp/fontenv && /tmp/fontenv/bin/pip install "fonttools[woff]"
  /tmp/fontenv/bin/python scripts/build-display-font.py \
      node_modules/@fontsource-variable/archivo/files src/assets/fonts

Archivo is under the SIL Open Font License 1.1, which allows subsetting and
instancing; the copyright and licence strings in the font's name table are
kept (name_IDs = '*').
"""
import os
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
src_dir, out_dir = sys.argv[1], sys.argv[2]
jobs = {
    'latin': ('archivo-latin-wdth-normal.woff2', 'U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-2019,U+201C-201D,U+2022,U+2026,U+2192,U+2248'),
    'latin-ext': ('archivo-latin-ext-wdth-normal.woff2', 'U+0100-017F'),
}
for name, (fname, uni) in jobs.items():
    f = TTFont(f'{src_dir}/{fname}')
    f = instancer.instantiateVariableFont(f, {'wdth': 118, 'wght': (600, 800)})
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['kern', 'liga', 'calt', 'tnum']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    s = subset.Subsetter(opts)
    unicodes = []
    for part in uni.split(','):
        a, _, b = part[2:].partition('-')
        unicodes += range(int(a, 16), int(b or a, 16) + 1)
    s.populate(unicodes=unicodes)
    s.subset(f)
    out = f'{out_dir}/archivo-expanded-{name}.woff2'
    f.flavor = 'woff2'
    f.save(out)
    print(out, os.path.getsize(out))
