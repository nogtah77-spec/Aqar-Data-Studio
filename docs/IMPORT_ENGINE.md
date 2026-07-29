# Import Engine — Aqar Data Studio

## Supported Formats

| Format   | Extensions       | Parser              |
|----------|------------------|---------------------|
| Excel    | .xlsx, .xls      | SheetJS (xlsx lib)  |
| CSV      | .csv             | Custom RFC-4180     |
| TSV      | .tsv, .txt       | Custom (tab-delimit)|

## Import Pipeline

```
File Upload
    ↓
Format Detection (by extension / MIME)
    ↓
Parse → ParseResult { items, sheets }
    ↓
Column Mapping Preview (auto-detect + manual override)
    ↓
Validation (missing required fields, unresolved regions)
    ↓
Dry Run Preview (add X / update Y / skip Z / error W)
    ↓
Confirm → POST /api/properties/import
    ↓
Server Upsert (dedup by code)
    ↓
Result Report
```

## Import Modes

| Mode     | Behavior                                              |
|----------|-------------------------------------------------------|
| `merge`  | Update if code exists, insert if new (default)       |
| `insert` | Skip existing codes, only insert new ones            |
| `update` | Only update existing codes, skip unknown ones        |
| `skip`   | Preview only, no writes (same as dry-run)             |

## Dry Run

Set `dryRun: true` in the import payload to simulate without writing:
```json
{ "items": [...], "mode": "merge", "dryRun": true }
```
Returns the same result object with `dryRun: true` and action labels
(`would_insert`, `would_update`) instead of actual writes.

## Excel Column Recognition (Arabic)

| Arabic Header             | Internal Field |
|---------------------------|----------------|
| النوع                     | unitType       |
| الكود                     | code           |
| المنطقة                   | subArea        |
| المساحة                   | area           |
| الدور                     | floorText      |
| التوزيع                   | layout         |
| ماستر                     | master         |
| التشطيب                   | finishing      |
| أسانسير / اسانسير         | elevator       |
| الفيو                     | view           |
| السعر                     | price          |
| المصدر                    | source         |
| الموقع                    | location       |

## Sheet-based Region Detection (Excel only)

The system detects `regionId` from sheet names using regex patterns:
- "شروق" → `shorouk`
- "مدينتي" → `madinaty`
- "عاصمة" → `new_capital`
… (12 regions supported)

## Price Parsing

Handles multiple formats:
- `2500000` → 2,500,000
- `2,500,000` → 2,500,000
- `2.5 مليون` → 2,500,000
- `250 ألف` → 250,000
- Arabic numerals (٢٥٠٠٠٠٠) → normalized
