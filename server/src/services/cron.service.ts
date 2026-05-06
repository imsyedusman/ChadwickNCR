import cron from 'node-cron';
import { db } from '../db';
import { capaActions, ncrs, notificationSettings, users, departments } from '../db/schema';
import { eq, and, lt, ne, inArray } from 'drizzle-orm';
import { emailService } from './email.service';
import { DateTime } from 'luxon';

class CronService {
  start() {
    console.log('[CronService] Initializing scheduled jobs...');
    // Run at 8:00 AM Sydney time every day
    cron.schedule('0 8 * * *', async () => {
      console.log('[CronService] Running daily overdue check (8:00 AM Sydney)...');
      await this.checkOverdueActions();
    }, {
      timezone: "Australia/Sydney"
    });
  }

  async checkOverdueActions() {
    try {
      const settings = await db.query.notificationSettings.findFirst({
        where: eq(notificationSettings.id, 1),
      });

      if (!settings?.globalEnabled || !settings?.overdueEnabled) {
        console.log('[CronService] Overdue notifications disabled. Skipping check.');
        return;
      }

      // Find all incomplete actions
      const incompleteActions = await db.query.capaActions.findMany({
        where: ne(capaActions.status, 'COMPLETED'),
        with: {
          ncr: {
            with: {
              issuedToDepartment: true,
              handler: true,
            }
          },
          owner: true,
        },
      });

      const today = DateTime.now().setZone('Australia/Sydney').startOf('day');

      for (const action of incompleteActions) {
        const dueDate = DateTime.fromJSDate(action.dueDate).setZone('Australia/Sydney').startOf('day');
        const daysOverdue = Math.floor(today.diff(dueDate, 'days').days);

        if (daysOverdue < 0) continue; // Not overdue yet

        let shouldNotify = false;

        if (daysOverdue === 0) {
          // On the due date
          shouldNotify = true;
        } else if (daysOverdue === settings.overdueFirstFollowUpDays) {
          // First follow-up
          shouldNotify = true;
        } else if (daysOverdue > settings.overdueFirstFollowUpDays) {
          // Recurring reminder
          const recurringOffset = daysOverdue - settings.overdueFirstFollowUpDays;
          if (recurringOffset % settings.overdueRecurringDays === 0) {
            shouldNotify = true;
          }
        }

        if (shouldNotify) {
          console.log(`[CronService] Action ${action.id} (NCR ${action.ncr.autoId}) is ${daysOverdue} days overdue. Sending notifications...`);
          
          const recipients = new Set<string>();
          if (action.owner?.email) recipients.add(action.owner.email);
          if (action.ncr.handler?.email) recipients.add(action.ncr.handler.email);
          
          // Get department handler
          const dept = action.ncr.issuedToDepartment;
          if (dept?.primaryHandlerId) {
            const handler = await db.query.users.findFirst({
              where: eq(users.id, dept.primaryHandlerId),
            });
            if (handler?.email) recipients.add(handler.email);
          }

          if (recipients.size > 0) {
            await emailService.notifyOverdueAction(action.ncr, action, Array.from(recipients), daysOverdue);
          }
        }
      }
    } catch (error) {
      console.error('[CronService] Error in overdue check:', error);
    }
  }
}

export const cronService = new CronService();
