# Regression execution record

## Approved reference

- Published baseline: `24d8c4ec9a8c6e0755daff3df803165d5bab7b5e`, branch `gh-pages`, `/review/`.
- Original archive: `IN_THE_LOOP_FINAL_APPROVED_EDITION(3).zip`.
- SHA-256: `c5c4249f41027501fee7755f8b9926089f59e323524bafe5d3b97c9ce87e6837`.
- ZIP comparison: `index.html` and all 12 assets match the approved commit exactly. `READ_ME.txt` exists only in the archive; it was not added to production.
- No editorial, design, media, prompt or production file changes. No deployment or merge.

## Checks established

Eight integrity tests plus 126 browser-project cases: 20 behavior/content tests and one visual case across six profiles. WebKit: 375, 390, 414 and 1440 pixels. Firefox: 390 and 1440 pixels. Visual comparisons run in the four WebKit profiles; the two Firefox visual cases are intentionally skipped.

All 23 ideas and 69 tool tabs are frozen. Idea 23 contains two additional approved alternatives, making 71 individual prompt texts; the click/copy test checks every variant.

Eleven committed component screenshots cover the cover, introduction, comparison video, all invitations, Carson essay and Arabic exchange, ideas collection and closing. Runtime comparisons always use the checksum-verified archive, never the candidate as the expected image. Screenshot framing and media freezing are test-only operations.

## Local execution to date

- Integrity: 8/8 passed.
- Controlled mutations in isolated temporary copies: changed HTML, changed MP4 and changed reference PNG were all rejected with a nonzero test exit. Approved files were untouched.
- Both MP4 and WebM real play/sound/pause tests passed three consecutive runs at 390px after source-reset setup was corrected. The setup waits for the pause event before changing formats, avoiding an artificial stale button label caused by the test resetting a playing media source.
- Full multi-profile execution and hosted Actions results are recorded in the follow-up execution section before delivery. This initial branch record does not claim those runs are complete.

## Platform and enforcement limitations

- No physical iPhone or actual iPhone Safari was available. Linux Playwright WebKit is automated engine testing, not a physical-device test.
- Native clipboard read-back is attempted; denied or unresolved automation-platform permission is reported as a skip. Exact clipboard API payloads, all three independent invitation buttons, all 71 idea prompts, and rejection feedback are tested through real clicks independently of native permission.
- ChatGPT destination buttons are actually clicked and their popup URLs checked against the approved destinations; the external response is intercepted so no prompt or private data is sent. Third-party service availability is not an uptime guarantee.
- The archive contains one approved comparison reel in MP4 and WebM, not three distinct videos. Both original formats and the poster remain byte-identical.
- The local browser sandbox requires a test-process workaround for Firefox (`MOZ_DISABLE_CONTENT_SANDBOX=1`); this does not change the website or CI deployment configuration.
- The GitHub integration returned 403 `Resource not accessible by integration` for branch-protection administration. Required checks were not configured. CODEOWNERS and test jobs alone do not prevent direct pushes or merges.
- This draft QA branch must be reviewed and merged before its PR workflow can protect future work. Nothing has been merged or deployed by this assignment.
