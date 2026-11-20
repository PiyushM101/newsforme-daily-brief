# Signed-in homepage: replace the signup boxes

## What changes
When someone is already signed in, both email signup boxes on the homepage (top and "Ready for a calmer morning?" at the bottom) are replaced with:

- Top: "Welcome back." + a short line "Your briefing arrives every morning." + an orange **Go to Profile** button.
- Bottom: heading "Want different stories?" + line "Change your topics, sources or delivery time any time." + **Edit my profile** button.

Signed-out visitors see exactly what they see today.

## Cost
Zero extra Perplexity or storage cost. It only checks the sign-in already stored in the browser (the same check the header uses). No new database reads, no AI calls.

## Workflow
Done in a draft, then a PR against main for your review (per your rule).

## Technical details
- In src/routes/index.tsx, use the existing `useSignedIn()` from site-chrome.tsx.
- New small `SignupOrWelcome` component: `null` (still checking) renders the form-height placeholder to avoid a flash; `true` renders the welcome block linking to /settings; `false` renders `MagicLinkForm`.
- Hide the "We will email you a code" helper text when signed in.
