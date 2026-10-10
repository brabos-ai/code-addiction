
   | `EPIC_DELIVERY` | Do |
   |---|---|
   | `automatic` | Print what `SFxx` delivered, then follow {{cmd:add-plan}} for this feature — it plans the next pending subfeature — as `add--delivery-mode` describes |
   | `semi-automatic` | **STOP — deciding.** Show what `SFxx` delivered and what the next subfeature will do, and WAIT. On the user's go, follow {{cmd:add-plan}}. This question IS the stop — do not also offer continuation instructions |
   | absent (`confirm`) | Keep the full checkpoint report for `SFxx`, then offer the continuation under `chat-continuation-eligibility-v1` and STOP |

**The `confirm` checkpoint keeps its whole report.** The offer is a question after that report, never a
replacement for it, and never a compression of it. The next activity is `/add-plan ${FEATURE_ID}` for
the next pending subfeature; on acceptance, `STEP add-build.handoff` answers it in one block.


