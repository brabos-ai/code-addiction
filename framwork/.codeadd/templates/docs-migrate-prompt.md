I just moved my project's Code Addiction documents to a new place, and I need you to finish the migration.

The documents now live in the folder .codeadd/docs/, which is a separate branch of this repository named codeadd-docs. They were moved exactly as they were. Some of them were written in an older document format and do not yet say which format they use.

Please do these four things, in order.

1. Review the migrated documents. Look at the folder layout of .codeadd/docs/ and open the files you need. Do not change anything in this step.

2. Bring every legacy document up to the current standard. A legacy document is a markdown file whose frontmatter has no schema line, or has a schema number lower than {{doc-schema}}. The current standard is defined by the skill named add--doc-schemas and by the files in its references folder. Find that skill in this project's installed skills and follow it. Change only what the standard asks for, and keep the meaning of every document.

3. On each file you adjusted, set this line in its frontmatter: schema: {{doc-schema}}. Do not stamp a file you did not adjust.

4. Report what you changed, file by file, as a short list. Name every file you skipped and say why.

Rules while you work. Touch only files under .codeadd/docs/. When you search those documents, always pass .codeadd/docs/ as the search path, because search tools skip folders that git ignores. When you are done, save your work with this command: node .codeadd/scripts/docs-branch.cjs commit "docs: bring legacy documents to schema {{doc-schema}}"
