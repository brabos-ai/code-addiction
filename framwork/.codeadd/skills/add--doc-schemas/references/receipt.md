# Receipt Schemas

Setup receipts are no longer documents. They are sections of `.codeadd/settings.json`, and their schema lives in `{{skill:add--settings/SKILL.md}}`: the generic receipt fields, the field rules, the vocabularies, the append-only `log` and the hard bans.

The `setup-receipt` name stays registered in the Schema Index so that a legacy markdown receipt, written by an earlier release, is still recognised as a receipt. Nothing writes a new one.
