import { expect, test } from 'vite-plus/test';

import { Section } from './section';
import { sectionData } from './data';

// ONE REFERENCE PER SECTION. An `Entry` carries a single `parentId`, the save
// path lifts a single cell into it, and `resolveDerivedCells` resolves every
// derived cell against that one id — so a section declaring two derived
// columns would resolve both to the same parent and print a raw UUID in
// whichever one didn't match. The resolver reads generically because that is
// the honest way to find the column, not because two are supported; this is
// the assertion that keeps the invariant true instead of the comment claiming
// it does.
//
// Iterating `Section.literals` rather than `sectionOrder`: the latter is a
// hand-maintained array, so a section missing from it would silently skip the
// check rather than fail it.
test('no section declares more than one derived column', () => {
  for (const section of Section.literals) {
    const derived = sectionData[section].columns.filter((column) => column.derived !== undefined);

    expect(derived.length, `${section} declares ${derived.length} derived columns`).toBeLessThan(2);
  }
});

// A derived column points at ANOTHER section, never at its own — a record
// cannot be its own parent, and the picker would offer the record being
// created as a candidate parent for itself.
test('a derived column never references its own section', () => {
  for (const section of Section.literals) {
    for (const column of sectionData[section].columns) {
      expect(column.derived).not.toBe(section);
    }
  }
});
