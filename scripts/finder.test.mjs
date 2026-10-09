import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { recommendProducts } from '../src/lib/finder.mjs';

const products = JSON.parse(await readFile(new URL('../src/data/products.json', import.meta.url), 'utf8'));
const answers = { destination: 'any', language: 'any', intake: 'any', qualification: 'secondary', support: 'full' };
const codes = (result) => result.map((product) => product.code);

test('a destination narrows recommendations to its available products', () => {
  for (const destination of ['china', 'europe', 'korea']) {
    const result = recommendProducts(products, { ...answers, destination });
    assert.deepEqual(codes(result), codes(products.filter((product) => product.country === destination)));
  }
});

test('open destination returns at most three real products without mutating input', () => {
  const snapshot = structuredClone(products);
  const result = recommendProducts(products, answers);
  assert.deepEqual(codes(result), codes(products));
  assert.ok(result.length <= 3);
  assert.deepEqual(products, snapshot);
  assert.ok(recommendProducts([...products, ...products], answers).length <= 3);
});

test('another qualification retains inquiry options for eligibility advice', () => {
  assert.deepEqual(codes(recommendProducts(products, { ...answers, qualification: 'other' })), codes(products));
});

test('known intakes exclude products with a different advertised intake', () => {
  for (const intake of ['2027-02', '2027-03']) {
    const result = recommendProducts(products, { ...answers, intake });
    assert.ok(result.some((product) => product.intake.value === intake));
    assert.ok(result.every((product) => product.intake.value === 'TODO' || product.intake.value === intake));
  }
});

test('English requests retain all available inquiry options', () => {
  assert.deepEqual(codes(recommendProducts(products, { ...answers, language: 'english' })), codes(products));
});

test('an unavailable selected intake falls back to the chosen destination for advice', () => {
  for (const [destination, intake] of [['europe', '2027-03'], ['korea', '2027-02']]) {
    const result = recommendProducts(products, { ...answers, destination, intake });
    assert.deepEqual(codes(result), codes(products.filter((product) => product.country === destination)));
  }
});

test('sanitized unknown intakes remain inquiry candidates', () => {
  const sanitized = products.map((product) => ({ ...product, intake: { ...product.intake, value: product.intake.value === 'TODO' ? 'unknown' : product.intake.value } }));
  const result = recommendProducts(sanitized, { ...answers, intake: '2027-02' });
  assert.deepEqual(codes(result), ['CN-BACH-2027', 'EU-BACH-2027']);
});

test('every offered answer combination yields one to three relevant inquiry options', () => {
  for (const destination of ['any', 'china', 'europe', 'korea']) {
    for (const qualification of ['secondary', 'other']) {
      for (const language of ['english', 'local', 'any']) {
        for (const intake of ['any', '2027-02', '2027-03']) {
          for (const support of ['full', 'application', 'visa']) {
            const result = recommendProducts(products, { destination, qualification, language, intake, support });
            assert.ok(result.length >= 1 && result.length <= 3, `${destination}/${qualification}/${language}/${intake}/${support}`);
            assert.ok(result.every((product) => destination === 'any' || product.country === destination));
            assert.ok(result.every((product) => products.some((candidate) => candidate.code === product.code)));
          }
        }
      }
    }
  }
});
