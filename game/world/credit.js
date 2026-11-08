// Community Bank credit: a lending pool, one loan at a time for the visitor, daily interest and
// a bounded journal. Ported in spirit from the earlier live-site economy, rebuilt on this town's
// money model: every dollar moves between the pool, the visitor's wallet/savings and (for the
// bank's retained interest) the pool again, so the soak test's conservation check still holds.
// All figures are fictional Town Dollars for a 24-minute game day, not real lending rates.
import { overdue } from './finance.js';

export const CREDIT = Object.freeze({
  pool: 1500,            // lending capital the credit union starts with (counted in town money)
  sizes: [100, 200, 400],
  dailyRate: 0.01,       // 1% of principal per town day, simple interest
  overdueRate: 0.02,     // doubled once past the due day
  termDays: 14,
  journalMax: 40,
});

export function freshCredit() {
  return { capital: CREDIT.pool, loan: null, earned: 0, journal: [], lastAccrual: 0 };
}

function credit(life) {
  const c = life.civic;
  if (!c.credit || typeof c.credit !== 'object') c.credit = freshCredit();
  const k = c.credit;
  if (!Array.isArray(k.journal)) k.journal = [];
  return k;
}

function note(life, text) {
  const k = credit(life);
  k.journal.unshift({ day: life.day, minute: Math.floor(life.minute), text });
  if (k.journal.length > CREDIT.journalMax) k.journal.length = CREDIT.journalMax;
}

const cents = (n) => Math.round(n * 100) / 100;
const owed = (loan) => (loan ? cents(loan.principal + loan.interest) : 0);

// Anything the visitor earns by working or trading counts as a track record for the bank.
export function recordEarning(life, amount) {
  if (amount > 0) credit(life).earned += amount;
}

export function noteBank(life, text) { note(life, text); }

// Villagers' home-loan repayments are deposited into the bank's lending pool.
export function bankReceives(life, amount) {
  if (amount > 0) credit(life).capital = cents(credit(life).capital + amount);
}

export function creditReport(life) {
  const k = credit(life), loan = k.loan;
  const rate = loan && life.day > loan.due ? CREDIT.overdueRate : CREDIT.dailyRate;
  return {
    capital: cents(k.capital), earned: k.earned, sizes: CREDIT.sizes,
    loan: loan ? { principal: loan.principal, interest: cents(loan.interest), owed: owed(loan), due: loan.due, overdue: life.day > loan.due, dailyInterest: cents(loan.principal * rate) } : null,
    journal: k.journal.slice(0, 8),
  };
}

export function borrow(life, amount) {
  const k = credit(life), me = life.civic.player;
  if (!life.open(life.place('bank'))) return 'The bank is closed (9:00–16:00).';
  if (!CREDIT.sizes.includes(amount)) return 'We lend $100, $200 or $400.';
  if (overdue(life) > 0) return 'Clear your overdue rent and power first.';
  if (k.loan) return `You already owe $${owed(k.loan)}. Repay that first.`;
  if (k.earned < 10) return 'The bank wants to see some income first. Sell something or do a job for the town.';
  if (k.capital < amount) return `The credit union only has $${Math.floor(k.capital)} to lend right now.`;
  k.capital = cents(k.capital - amount);
  me.bank += amount;
  k.loan = { principal: amount, interest: 0, day: life.day, due: life.day + CREDIT.termDays };
  note(life, `Loan of $${amount} approved. Due day ${k.loan.due}, ${Math.round(CREDIT.dailyRate * 100)}% a day.`);
  return `Loan of $${amount} paid into your savings. Repay by day ${k.loan.due}.`;
}

// Interest first, then principal. Wallet is used first, then savings.
export function repay(life, amount) {
  const k = credit(life), me = life.civic.player, loan = k.loan;
  if (!life.open(life.place('bank'))) return 'The bank is closed (9:00–16:00).';
  if (!loan) return 'You have no loan.';
  const can = Math.floor(me.wallet + me.bank);
  const pay = Math.min(Math.floor(amount), Math.ceil(owed(loan)), can);
  if (pay <= 0) return 'You have nothing to repay with.';
  let left = pay;
  const fromWallet = Math.min(me.wallet, left); me.wallet = cents(me.wallet - fromWallet); left = cents(left - fromWallet);
  const fromBank = Math.min(me.bank, left); me.bank = cents(me.bank - fromBank); left = cents(left - fromBank);
  k.capital = cents(k.capital + pay);
  const toInterest = Math.min(loan.interest, pay);
  loan.interest = cents(loan.interest - toInterest);
  loan.principal = cents(loan.principal - (pay - toInterest));
  if (loan.principal <= 0.004 && loan.interest <= 0.004) {
    // Rounding dust on the final payment stays with the bank.
    k.loan = null;
    note(life, `Loan repaid in full ($${pay} today).`);
    return `Paid $${pay}. Your loan is cleared.`;
  }
  note(life, `Repaid $${pay}. $${owed(loan)} still owing.`);
  return `Paid $${pay}. You still owe $${owed(loan)}.`;
}

// Called once at each new day. Interest accrues as a liability (it is not money until paid).
export function accrueInterest(life) {
  const k = credit(life), loan = k.loan;
  if (!loan || k.lastAccrual === life.day) return;
  k.lastAccrual = life.day;
  const overdue = life.day > loan.due;
  const add = cents(loan.principal * (overdue ? CREDIT.overdueRate : CREDIT.dailyRate));
  loan.interest = cents(loan.interest + add);
  if (overdue && life.day === loan.due + 1) note(life, `Your loan is overdue. Interest is now ${Math.round(CREDIT.overdueRate * 100)}% a day.`);
}
