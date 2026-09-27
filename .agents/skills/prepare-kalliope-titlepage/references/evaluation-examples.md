# Evaluation examples

Use these immutable GitHub commit pairs only when forward-testing changes to
the title-page workflow. Fetch images to a temporary directory and never add
them as repository fixtures.

| Pull request | Corrected commit | Image | Expected classification |
| --- | --- | --- | --- |
| #1656 | `3552aa188a` | `public/images/hansenm/1867-p1.jpg` | rotation and crop |
| #1657 | `d9a196d52f` | `public/images/drejer/1837-p1.jpg` | crop |
| #1624 | `1d8b8269dc` | `public/images/nielsena/1923-p1.jpg` | rotation and crop |
| #1472 | `caca6852e6` | `public/images/hansen/1917-p1.jpg` | scanner-edge removal |
| #1468 | `6ac4cb4ac0` | `public/images/hoffmann/1919-p1.jpg` | scanner-edge removal |
| #1479 | `719caa66e8` | `public/images/levy/1920-p1.jpg` | scanner-edge removal |
| #1473 | `00383129b0` | `public/images/hanseno/1918-2-p1.jpg` | higher-resolution source |
| #1527 | `6fb07b1abb` | `public/images/sorterup/1889-p1.jpg` | source replacement |
| #1428 | `4881431198` | `public/images/moellern/1920-p1.jpg` | source replacement |

For a corrected commit, its first parent contains the prior image. A geometry
test is successful when the tool preserves the same physical page and reaches
the documented crop/rotation intent. Source-replacement pairs must not be
treated as targets for geometric imitation.
