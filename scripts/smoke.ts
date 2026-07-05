import { MockRepository } from '@/lib/mock/MockRepository';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error('ASSERT FAILED: ' + msg);
  console.log('  ok:', msg);
}

function isFiniteNum(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

async function main() {
  const repo = new MockRepository();
  await repo.init();

  const businesses = await repo.getBusinesses('demo-owner');
  assert(businesses.length > 0, 'seed has at least one business');
  const business = businesses[0];
  console.log('business:', business.name);

  // --- Loans / installments ---
  const loan = await repo.createLoan(business.id, {
    lender_name: 'Test Bank',
    lender_type: 'bank',
    loan_type: 'term',
    principal: 50000,
    interest_rate: 12,
    interest_type: 'flat',
    total_installments: 10,
    frequency: 'monthly',
    disbursed_on: '2026-01-01',
    first_due_date: '2026-02-01',
  } as any);
  console.log('created loan:', loan.id, 'outstanding:', loan.outstanding);

  const installments = await repo.getInstallments(loan.id);
  assert(installments.length === 10, `installments generated (got ${installments.length})`);
  assert(
    installments.every((i) => isFiniteNum(i.amount) && i.amount > 0),
    'all installment amounts are finite positive numbers',
  );

  const paidLoan = await repo.payInstallment(loan.id, undefined, '2026-02-05');
  assert(isFiniteNum(paidLoan.outstanding), 'loan.outstanding finite after payment');
  const paymentsAfter1 = await repo.getLoanPayments(business.id);
  const thisLoanPayments = paymentsAfter1.filter((p) => p.loan_id === loan.id);
  assert(thisLoanPayments.length === 1, 'one loan_payments row recorded');
  assert(isFiniteNum(thisLoanPayments[0].days_late), 'days_late is a finite number');
  console.log('  days_late:', thisLoanPayments[0].days_late);

  // --- Transaction + line items + delete reversal ---
  const products = await repo.getProducts(business.id);
  assert(products.length > 0, 'seed has products');
  const product = products[0];

  const partiesBefore = await repo.getParties(business.id, 'customer');
  const customer = partiesBefore[0];
  assert(!!customer, 'seed has a customer party');
  const balanceBefore = customer.balance;

  const tx = await repo.createTransaction({
    business_id: business.id,
    type: 'sale',
    party_id: customer.id,
    amount: 500,
    is_credit: true,
    payment_method: null,
    note: 'smoke test sale',
    line_items: [
      { product_id: product.id, qty: 2, unit_price: 250 },
    ],
  } as any);
  console.log('created tx:', tx.id, 'amount:', tx.amount);

  const lineItems = await repo.getLineItems(business.id);
  const txLineItems = lineItems.filter((li) => li.transaction_id === tx.id);
  assert(txLineItems.length === 1, 'line item persisted for transaction');

  const customerAfterTx = await repo.getParty(customer.id);
  assert(!!customerAfterTx, 'customer still exists');
  console.log('  balance before:', balanceBefore, 'after credit sale:', customerAfterTx!.balance);

  await repo.deleteTransaction(tx.id);
  const customerAfterDelete = await repo.getParty(customer.id);
  assert(
    Math.abs((customerAfterDelete!.balance ?? 0) - balanceBefore) < 0.01,
    `balance reversed correctly after delete (before=${balanceBefore}, after-delete=${customerAfterDelete!.balance})`,
  );

  // --- Report / COGS / aging ---
  const report = await repo.getReport(business.id, 90);
  assert(isFiniteNum(report.sales), 'report.sales finite');
  assert(isFiniteNum(report.profit), 'report.profit finite');
  assert(Array.isArray(report.receivablesAging), 'receivablesAging is an array');
  console.log('  report cogsSales:', report.cogsSales, 'cogs:', report.cogs, 'grossMarginPercent:', report.grossMarginPercent);
  if (report.grossMarginPercent !== null) {
    assert(isFiniteNum(report.grossMarginPercent), 'grossMarginPercent finite when non-null');
  }
  for (const bucket of report.receivablesAging) {
    assert(isFiniteNum(bucket.amount) && isFiniteNum(bucket.count), `aging bucket ${bucket.bucket} has finite amount/count`);
  }

  // --- Credit score engine ---
  const score = await repo.getCreditScoreSummary(business.id);
  assert(isFiniteNum(score.score), 'score.score is finite');
  assert(score.score >= 0 && score.score <= 1000, `score in [0,1000] (got ${score.score})`);
  assert(typeof score.band?.label_bn === 'string' && score.band.label_bn.length > 0, 'band has a label');
  assert(['preliminary', 'building', 'verified'].includes(score.confidence), `confidence is valid (got ${score.confidence})`);
  assert(isFiniteNum(score.percentile), 'percentile finite');
  assert(isFiniteNum(score.recommendation.limit_bdt), 'recommendation.limit_bdt finite');
  assert(score.recommendation.limit_bdt >= 0, 'recommendation.limit_bdt non-negative');
  console.log('  score:', score.score, 'band:', score.band.label_bn, 'confidence:', score.confidence, 'limit:', score.recommendation.limit_bdt);
  for (const f of [...score.green_flags, ...score.red_flags]) {
    assert(typeof f.text_bn === 'string' && f.text_bn.length > 0, 'flag has non-empty text_bn');
  }

  // call again same day -> snapshot should NOT duplicate (throttle guard)
  const snap1 = await repo.getLatestCreditScoreSnapshot(business.id);
  await repo.getCreditScoreSummary(business.id);
  const snap2 = await repo.getLatestCreditScoreSnapshot(business.id);
  assert(snap1?.id === snap2?.id, 'credit score snapshot throttled (same id on same-day re-fetch)');

  console.log('\nALL SMOKE CHECKS PASSED');
}

main().catch((err) => {
  console.error('\nSMOKE TEST FAILED');
  console.error(err);
  process.exit(1);
});
