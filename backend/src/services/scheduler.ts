import { cancelUnpaidDeposits, sendUpcomingCheckInReminders } from './bookingService';

export function startScheduler() {
  const run = () => {
    sendUpcomingCheckInReminders().catch((e) => console.error('reminder job failed', e));
    cancelUnpaidDeposits().catch((e) => console.error('deposit job failed', e)); // timer event: auto-cancel unpaid deposits
  };
  run();
  setInterval(run, 10 * 60 * 1000);
}
