import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { feesVisible, feeLabel, publicFees } from '../src/lib/fees.mjs';

const fees = JSON.parse(await readFile(new URL('../src/data/fees.json', import.meta.url), 'utf8'));

test('draft fee data never enters the default public payload', () => {
  for (const flag of [undefined, '', '0', 'false', 'true']) {
    assert.equal(feesVisible('draft', flag), false);
    assert.equal(publicFees(fees, flag), null);
    for (const code of Object.keys(fees.rates)) assert.equal(feeLabel(code, fees, flag), 'Fees: contact us');
  }
});

test('only the explicit draft preview flag exposes exact configured rates', () => {
  assert.equal(feesVisible('draft', '1'), true);
  const preview = publicFees(fees, '1');
  assert.deepEqual(preview.rates, fees.rates);
  assert.deepEqual(preview.discount, fees.discount);
  for (const [code, rate] of Object.entries(fees.rates)) {
    const label = feeLabel(code, fees, '1');
    assert.match(label, /USD/);
    assert.ok(label.includes(String(rate.stage1)));
    assert.ok(label.replaceAll(',', '').includes(String(rate.stage2)));
    assert.equal(rate.rejected_stage2, 0);
  }
});

test('visibility calculation does not mutate source fee data', () => {
  const snapshot = structuredClone(fees);
  publicFees(fees, '1');
  publicFees(fees, '0');
  for (const code of Object.keys(fees.rates)) feeLabel(code, fees, '1');
  assert.deepEqual(fees, snapshot);
});
