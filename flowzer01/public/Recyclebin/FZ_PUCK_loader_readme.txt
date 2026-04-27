PUCKloader_readme.txt
=====================

Purpose:
--------
This file provides instructions and metadata for any system or user importing a PUCK (Portable User Configuration Knowledge) file. It should always be included as the first section or file when generating or uploading a PUCK, to ensure consistent interpretation and integration.

Contents:
---------
- File Structure: Describes the expected JSON structure and required fields for profiles, tokens, and stickies.
- Field Limits: Specifies the maximum number of items (e.g., 16 profiles, 16 stickies, 64 tokens).
- Field Definitions: Explains the meaning and expected format for each field (label, value, flag, etc.).
- Versioning: Indicates the PUCK schema version and any compatibility notes.
- Import Instructions: Steps for receiving systems to parse and validate the PUCK file.
- Contact/Support: Where to get help or report issues with PUCK files.

Template (edit as needed):
-------------------------
1. PUCK File Structure
   - { "profile": [ ... ], "FZ_Tokens": [ ... ], "sticky": [ ... ] }
2. Field Limits
   - Max 16 label types per profile
   - Max 64 records per profile
   - Max 16 stickies per profile
   - Max 64 tokens per PUCK
3. Field Definitions
   - label: string, required for profiles
   - value: string, required for profiles
   - flag: "public" | "private" | "secret"
   - ... (add more as needed)
4. Version: 1.0.0
5. Import Instructions
   - Always read this file first before parsing the PUCK JSON
   - Validate field limits and required fields
   - ... (add more as needed)
6. Contact: [your contact or support info here]

---
Edit this file to update instructions as your PUCK format evolves.