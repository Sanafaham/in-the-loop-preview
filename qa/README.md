# Approved-edition regression protection

This branch adds QA only. It does not modify or deploy the magazine.

Approved publication: `24d8c4ec9a8c6e0755daff3df803165d5bab7b5e`, `gh-pages`, `/review/`.

The exact owner-supplied `IN_THE_LOOP_FINAL_APPROVED_EDITION(3).zip` is preserved in `qa/approved/`. Its SHA-256 is `c5c4249f41027501fee7755f8b9926089f59e323524bafe5d3b97c9ce87e6837`. HTML and all 12 assets match the approved Git commit. The archive alone includes `READ_ME.txt`; it is not added to production.

## Run

Use Node 22 and Python 3:

```sh
npm ci --ignore-scripts
npx playwright install --with-deps webkit firefox
npm test
```

`npm run test:integrity` checks the original archive, the entire review file set, every content/asset hash, relative paths, the 23 ideas in order, all 69 tool-specific prompt groups (71 prompt variants), and unchanged original website files. The complete HTML hash also freezes copy, captions, source links, styles, fonts, navigation, and interaction code.

The browser suite uses real clicks and media playback at WebKit widths 375, 390, 414 and 1440, plus Firefox 390 and 1440. It covers invitation titles/prompts, exact independent clipboard API payloads, denied-clipboard recovery, new-tab destinations, all idea tabs/copy controls, navigation, filters, questions, play/pause/sound, blocked autoplay recovery, loaded assets, typography and touch controls. Native clipboard read-back is attempted separately and explicitly skipped where the automation platform denies access. API-boundary tests still verify every copied character.

No prompts or private files are sent to ChatGPT. Destination clicks are routed to a test response after checking the actual opened URL. Third-party service uptime and physical-device clipboard permissions are outside this deterministic PR gate.

## Visual approval cannot come from the candidate

Committed screenshots in `qa/baselines/` are review references captured from the checksum-verified original archive. Their hashes are locked in `qa/approved/visual-manifest.json`. Test execution never overwrites them, and `--update-snapshots` is rejected.

For each visual comparison, CI renders the **immutable original archive** and the proposed review page in the same pinned browser, viewport and environment, then performs a zero-changed-pixel comparison (pixelmatch perceptual threshold 0.1, antialiasing excluded). Both captures and any diff are attached to the report. This avoids treating OS/font-rendering differences as editorial changes. Reference screenshots are never generated from the candidate page. Only video playback is frozen with its unchanged poster as the video background for the visual capture; separate tests play both original formats and exercise controls.

Covered views: cover photograph and introduction, video and controls, each of the three invitations, Carson introduction and Arabic name exchange, first/last collection rows, and the closing.

`QA_CAPTURE_REFERENCE=1` is a one-time initial capture mode that refuses to overwrite an existing file and is forbidden in CI. Baseline changes require explicit owner approval and a separately reviewed update to the approval lock. They cannot be silently accepted with a test flag.

## Merge enforcement and deployment

The workflow runs on PRs and pushes to the QA branch. It has read-only repository permissions and no deployment step. After this QA PR is reviewed and merged, it will run for future PRs. Until then the workflow remains on this separate branch.

Required statuses to configure administratively: `Approved edition lock`, `Content and asset integrity`, `Browser and visual regression`. Also require owner review for `CODEOWNERS`, prevent bypass/direct pushes to `gh-pages`, and do not permit baseline changes without owner review. Merely adding this workflow or CODEOWNERS does **not** configure branch protection.

The GitHub connection used for this work returned 403 `Resource not accessible by integration` for branch-protection administration. No protection/ruleset or production publishing settings were changed. Without required checks and restricted direct pushes, repository writers can bypass these tests.

## Existing defects and limitations

See `qa/RESULTS.md` for actual execution evidence. Any failure on the unchanged approved page must be documented there. Product defects are not repaired by this QA assignment.

A real iPhone Safari test is not claimed. Automated WebKit on Linux approximates Safari's engine, not the physical iPhone environment. The approved source contains one comparison video in MP4 and WebM formats, not three separate videos. Both byte-identical assets are protected.
