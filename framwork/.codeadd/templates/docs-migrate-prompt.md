I just moved my project's Code Addiction documents to a new place, and I need you to finish the migration.

The documents now live in the folder .codeadd/docs/, which is a separate branch of this repository named codeadd-docs. They were moved exactly as they were. Some of them were written in an older document format and do not yet say which format they use.

Please do these six things, in order.

1. Review the migrated documents. Look at the folder layout of .codeadd/docs/ and open the files you need. Do not change anything in this step.

2. Read .codeadd/docs/migration-report.md if it exists. It lists every document the migration could not stamp on its own, with one reason each. That list is your work list. Work through it.

3. Bring every legacy document up to the current standard. A legacy document is a markdown file whose frontmatter has no schema line, or has a schema number lower than {{doc-schema}}. The current standard is defined by the skill named add--doc-schemas and by the files in its references folder. Find that skill in this project's installed skills and follow it. Change only what the standard asks for, and keep the meaning of every document.

4. On each file you adjusted, set this line in its frontmatter: schema: {{doc-schema}}. Do not stamp a file you did not adjust. Never invent a provenance hash: if a design document has none, leave it in the report and say so in your list.

5. Fix the code that still points at the old places. The migration summary printed above this prompt lists, under needs update, every line in this project that still names a moved path, as a file name and a line number. Fix every file listed under needs update so that it reads the new location under .codeadd/docs/. Change only the path, never the logic around it. If the summary lists none, skip this step.

6. Report what you changed, file by file, as a short list. Name every file you skipped and say why. Then run codeadd docs migrate again, so the report is refreshed to what is still left.

Rules while you work. Touch only files under .codeadd/docs/, except the files listed under needs update in the migration summary. When you search those documents, always pass .codeadd/docs/ as the search path, because search tools skip folders that git ignores. When you are done, save your work with this command: node .codeadd/scripts/docs-branch.cjs commit "docs: bring legacy documents to schema {{doc-schema}}"
