---
type: Prompt
title: TFSS Data Extraction and Formatting
description: Prompt for generating ICS calendar events and a tab-delimited list from TFSS delivery structured data.
tags: [snp, prompt, automation, tfss, ics, calendar]
status: stable
generated: { by: opencode/glm-5.3, at: 2026-09-21T00:00:00Z }
stale_after: 2027-03-20T00:00:00Z
sources:
  - id: import
    resource: /Users/aaron/Downloads/SNP_ Prompt for TFSS Data Extraction and Formatting.md
    title: SNP Prompt for TFSS Data Extraction and Formatting (imported prompt)
    author: human:aaron
---

# TFSS Data Extraction and Formatting

**Task:** Extract delivery information from the provided structured data and generate two outputs:

1. **ICS Calendar Events**
2. **Tab-Delimited List**

**Instructions:**

Using the information provided in the context, please perform the following:

1. **Identify the deliveries** by reading the structured data, including the school name, address, week cycle, product details (product name, package description, approximate portions per case, and quantity of cases).

2. **Generate ICS calendar events** for each week cycle with the following specifications:
   - **UID:** Use the format `del-YYYYMMDD@rawlinson-snp` for unique event identifiers.
   - **DTSTAMP:** Provide a synthetic timestamp (e.g., `20260408T000000Z`).
   - **DTSTART and DTEND:** Reflect the corresponding delivery dates (all-day events).
   - **SUMMARY:** Concatenate product names without quantities, separated by " and ".
   - **LOCATION:** Include the school address exactly as provided.
   - **DESCRIPTION:** List items with their respective quantities and any relevant details in the specified format.

3. **Generate a tab-delimited list** for each product entry with the following fields:
   - `Product_Name`
   - `Approximate_Portion_Per_Case`
   - `Quantity_Of_Cases`
   - `0`
   - `0`
   - `0`
   - `Additional_Info` (from package description)
   - Category — **inferred per product** against the Deliveries sheet's four-label vocabulary (Fruit, Grain, Protein, Alternative): produce and dried fruit → `Fruit`; whole-grain baked goods, crackers, breadsticks, and granola bars → `Grain`; dairy items (yogurt, cheese portions) → `Protein`. TFSS ships all components — never hardcode a single category.
   - `TFSS` (static value)
   - `Date` (the corresponding delivery date for each product)

**Format Example:**

1. **ICS Event Example:**
   ```
   BEGIN:VEVENT
   UID:del-20260429@rawlinson-snp
   DTSTAMP:20260408T000000Z
   DTSTART;VALUE=DATE:20260429
   DTEND;VALUE=DATE:20260430
   SUMMARY:Apple (Mini) and Raisin (Individual) and Rice Crisps - Vanilla and Yogurt Tube
   LOCATION:Rawlinson Community School - 231 Glenholme Ave, Toronto, ON
   DESCRIPTION:Week Cycle A\nItems (Item | Unit | PackSize | Notes):\n- Apple (Mini) | 188 | 7 | 138-170 units/case (individual, loose)\n- Raisin (Individual) | 120 | 6 | 30g each, 120 each/cs\n...
   END:VEVENT
   ```

2. **Tab-Delimited Example:**
   ```
   Apple (Mini) 188 7 0 0 0 138-170 units/case (individual, loose) Fruit TFSS 2026-04-29
   Raisin (Individual) 120 6 0 0 0 30g each, 120 each/cs Fruit TFSS 2026-04-29
   Cheese Portions - Marble 100 8 0 0 0 100 units/case, 21 g/units, (individual) Protein TFSS 2026-04-29
   ```

**Context:**
Provide the structured data necessary for extraction and processing below.
