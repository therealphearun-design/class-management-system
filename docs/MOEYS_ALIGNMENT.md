# MoEYS Alignment Notes (Cambodia Public High School)

Last updated: March 4, 2026

## Purpose
This project is configured for Cambodian public secondary education context and should follow MoEYS references for grade coverage and learning materials.

## Source References
- MoEYS OER portal (official): https://oer.moeys.gov.kh/
- MoEYS OER search categories showing `Grade 7` to `Grade 12` and `Lower Secondary` / `Upper Secondary`: https://oer.moeys.gov.kh/search
- Example MoEYS OER textbook page (Grade 7 English): https://oer.moeys.gov.kh/2016/11/eng7.html
- Example MoEYS OER textbook page (Grade 8 English): https://oer.moeys.gov.kh/2016/12/eng8.html
- MoEYS Sala Digital library (official platform): https://sala.moeys.gov.kh/
- MoEYS Education Strategic Plan (ESP 2024-2028) library entry: https://sala.moeys.gov.kh/en/library/00004267

## Current App Alignment
- Grade/class generator covers Grades `7-12` with sections `A-F`.
- Class-related defaults now start from the first configured MoEYS-style class code (`7A` in current config).
- Subject options are adjusted to Khmer-first and Cambodian-secondary-school-appropriate labels:
  - Khmer Language & Literature
  - Mathematics
  - Physics / Chemistry / Biology
  - English / French
  - History / Geography / Civics and Morality
  - Physical Education & Sports
  - Digital Literacy / ICT
  - Life Skills and Career Orientation
- Reports and exam subject selectors now reuse the centralized subject list to avoid mismatch.

## Review Checklist (for future updates)
- Confirm school-specific streams (Science/Social) for upper secondary each academic year.
- Confirm yearly exam schedules and policy changes from current MoEYS circulars.
- Keep grade naming, subject labels, and term names consistent with the school’s provincial MoEYS implementation.
