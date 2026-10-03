# Fonts

Loaded by `src/lib/fonts.ts`. Each file is one style, cut from the variable font
Google Fonts publishes, keeping Latin, Latin-1 and Vietnamese in one file so the
name's Đ never pulls in a second one.

| File | Source (github.com/google/fonts, `ofl/`) | Notes |
| --- | --- | --- |
| `fraunces.woff2` | `fraunces/Fraunces[SOFT,WONK,opsz,wght].ttf` | all four axes |
| `fraunces-italic.woff2` | `fraunces/Fraunces-Italic[SOFT,WONK,opsz,wght].ttf` | all four axes |
| `geist.woff2` | `geist/Geist[wght].ttf` | |
| `geist-mono.woff2` | `geistmono/GeistMono[wght].ttf` | |
| `playpen-sans-400.woff2` | `playpensans/PlaypenSans[wght].ttf` | pinned to 400 first |

All are under the SIL Open Font License 1.1, with no Reserved Font Name: the
`OFL-*.txt` files beside them (Geist Mono shares Geist's).

To cut them again, with `pip install fonttools brotli`:

```sh
U="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB"

# Playpen only: one weight, before subsetting.
python -m fontTools.varLib.instancer "PlaypenSans[wght].ttf" wght=400 -o PlaypenSans-400.ttf

# Each source, here Fraunces upright. tnum and pnum on top of the default features,
# as Google serves them: the labels and counts set tabular figures.
python -m fontTools.subset "Fraunces[SOFT,WONK,opsz,wght].ttf" --unicodes="$U" \
  --layout-features+=tnum,pnum --flavor=woff2 --output-file=fraunces.woff2
```

The range is Google's `latin` subset plus its `vietnamese` one.
