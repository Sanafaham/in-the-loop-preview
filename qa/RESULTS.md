# Regression execution record

## Approved reference

- Published baseline: `24d8c4ec9a8c6e0755daff3df803165d5bab7b5e`, branch `gh-pages`, `/review/`.
- Original archive: `IN_THE_LOOP_FINAL_APPROVED_EDITION(3).zip`.
- SHA-256: `c5c4249f41027501fee7755f8b9926089f59e323524bafe5d3b97c9ce87e6837`.
- ZIP comparison: `index.html` and all 12 assets match the approved commit exactly. `READ_ME.txt` exists only in the archive; it was not added to production.
- No editorial, design, media, prompt or production file changes. No deployment or merge.

## Checks established

Nine integrity tests plus 126 browser-project cases: 20 behavior/content tests and one visual case across six profiles. WebKit: 375, 390, 414 and 1440 pixels. Firefox: 390 and 1440 pixels. Visual comparisons run in the four WebKit profiles; the two Firefox visual cases are intentionally skipped.

All 23 ideas and 69 tool tabs are frozen. Idea 23 contains two additional approved alternatives, making 71 individual prompt texts; the click/copy test checks every variant.

Eleven committed component screenshots cover the cover, introduction, comparison video, all invitations, Carson essay and Arabic exchange, ideas collection and closing. Runtime comparisons always use the checksum-verified archive, never the candidate as the expected image. Screenshot framing and media freezing are test-only operations.

## Local execution to date

- Integrity: 9/9 passed, including four installed-lock fixtures proving review/baseline/workflow mutations fail while unrelated website-page edits remain allowed.
- Controlled mutations in isolated temporary copies: changed HTML, changed MP4 and changed reference PNG were all rejected with a nonzero test exit. Approved files were untouched.
- Both MP4 and WebM real play/sound/pause tests passed three consecutive runs at 390px after source-reset setup was corrected. The setup waits for the pause event before changing formats, avoiding an artificial stale button label caused by the test resetting a playing media source.
- The first complete local matrix finished with 113 passed, 7 failed and 6 skipped. The failures were six Firefox media cases blocked by this execution sandbox and one 414px screenshot taken before a scroll-reveal observer ran. No magazine files were changed to resolve them.
- After waiting for metadata and scroll reveals, the visual cases passed at all four WebKit widths (44 component comparisons, zero changed pixels).
- After allowing the local Firefox utility/audio subprocess, both media formats, sound/pause controls and blocked-autoplay recovery passed at Firefox 390px and 1440px: six targeted reruns passed.
- All three invitations passed exact-copy, independent-feedback, popup-destination and clipboard-denial tests in every profile. Native clipboard write/read-back also passed for all three invitations in both Firefox profiles. Four WebKit native-read tests explicitly skipped on unavailable read permission.
- All 23 ideas, all 69 tool tabs and all 71 approved prompt variants passed their real click/copy tests in every profile.
- All image/font/video HTTP byte checks, relative paths, navigation, Start Reading, filters, featured cards, FAQs, touch/layout checks and JavaScript-error checks passed in every profile.
- Hosted CI results and downloadable HTML reports/traces are available in [PR #1 checks](https://github.com/Sanafaham/in-the-loop-preview/pull/1/checks). Consult the check for the current head commit. The final delivery report states the verified hosted run result; this file records local execution separately.

## Platform and enforcement limitations

- No physical iPhone or actual iPhone Safari was available. Linux Playwright WebKit is automated engine testing, not a physical-device test.
- Native clipboard read-back is attempted; denied or unresolved automation-platform permission is reported as a skip. Exact clipboard API payloads, all three independent invitation buttons, all 71 idea prompts, and rejection feedback are tested through real clicks independently of native permission.
- ChatGPT destination buttons are actually clicked and their popup URLs checked against the approved destinations; the external response is intercepted so no prompt or private data is sent. Third-party service availability is not an uptime guarantee.
- The archive contains one approved comparison reel in MP4 and WebM, not three distinct videos. Both original formats and the poster remain byte-identical.
- The local browser sandbox requires a test-process workaround for Firefox (`MOZ_DISABLE_CONTENT_SANDBOX=1 MOZ_DISABLE_RDD_SANDBOX=1 MOZ_DISABLE_UTILITY_SANDBOX=1`); this does not change the website or CI deployment configuration.
- The GitHub integration returned 403 `Resource not accessible by integration` for branch-protection administration. Required checks were not configured. CODEOWNERS and test jobs alone do not prevent direct pushes or merges.
- This draft QA branch must be reviewed and merged before its PR workflow can protect future work. Nothing has been merged or deployed by this assignment.

## Media inspection

`ffprobe` verified both original 1280×720 assets have audio: MP4 uses H.264/AAC and WebM uses VP9/Opus. Browser tests verify advancing playback time, unmuted state/positive volume and stable paused time. Audible speaker output and physical iPhone playback are not claimed.

## Hosted verification and transient-feedback sampling

[Hosted PR run on d4f54dce](https://github.com/Sanafaham/in-the-loop-preview/actions/runs/38986561378) completed successfully: approval lock passed, all 9 integrity tests passed, and the browser job reported 120 passed and 6 expected skips. This includes both video formats and controls, all invitations, all 71 prompt variants, navigation, responsive checks and all 44 visual comparisons.

The redundant push run on the same commit reported two failures when polling the temporary 1.8-second `Selected` label after a WebKit click returned. Its [failure evidence is preserved](https://github.com/Sanafaham/in-the-loop-preview/actions/runs/38986558514). The test now observes the actual label/selection/toast mutation during the real click, also checking the exact rejected clipboard payload and persistent complete text selection. Ten targeted repetitions at the affected 375px and 414px profiles passed. No magazine code was altered. The duplicate push trigger was removed; every PR and manual dispatch still runs the complete gate.

A four-worker stress run also exceeded the former 90-second deadline for the 71-copy case. Its assertions were preserved and only that long case received a 180-second deadline; four simultaneous repetitions then passed. The workflow uses two workers by default.

The current-head CI result is available from the PR checks link above; the final delivery report records that result separately from this historical evidence.
