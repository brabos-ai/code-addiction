
If it exists → per-key merge: keep every existing key (including extras the user added). Fill missing declared keys with defaults. Never drop a user key. Confirm/refresh values with the user; do not silently overwrite a user-edited value with the default. If absent → create it. Every value comes from the project analysis; ask only what the analysis could not infer. Never ask for a secret value, only the env var name that holds it.


