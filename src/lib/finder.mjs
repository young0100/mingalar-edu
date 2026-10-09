// Pure client-side matching: no storage, analytics or network request.
export function recommendProducts(products, answers) {
  const candidates = products.filter((product) => answers.destination === 'any' || product.country === answers.destination);
  const preferred = candidates.filter((product) => answers.intake === 'any' || !/^\d{4}-\d{2}$/.test(product.intake.value) || product.intake.value === answers.intake);
  // Unknown qualifications, language and support preferences require a conversation.
  // If the requested intake is unavailable, retain inquiry options with a caveat.
  return (preferred.length ? preferred : candidates).slice(0, 3);
}
