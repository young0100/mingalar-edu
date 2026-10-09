export function feesVisible(status, envFlag) {
  return status !== 'draft' || envFlag === '1';
}

export function publicFees(data, envFlag) {
  return feesVisible(data.status, envFlag) ? data : null;
}

export function feeLabel(code, data, envFlag) {
  if (!feesVisible(data.status, envFlag)) return 'Fees: contact us';
  const rate = data.rates[code];
  return `${data.currency} ${rate.stage1} / ${data.currency} ${rate.stage2}`;
}
