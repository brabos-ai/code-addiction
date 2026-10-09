
If it exists → per-key merge: keep every existing key (including extras the user added). Fill missing declared keys with defaults. Never drop a user key. Confirm/refresh values with the user; do not silently overwrite a user-edited value with the default. If absent → create it interactively, asking for the project-specific values (do NOT guess base URL or auth/seed flow).


