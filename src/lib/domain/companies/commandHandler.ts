import { v4 as uuidv4 } from 'uuid';
import { saveEvents } from '@/lib/db/event-store';
import type { CreateCompanyCommand } from './commands';
import type { CompanyCreatedEvent } from './events';

export class CompaniesCommandHandlers {
  
  static async handleCreateCompany(command: CreateCompanyCommand) {
    // 1. Validation
    if (!command.name) {
      throw new Error('Company name is required');
    }

    // 2. Create Event
    const newCompanyId = `company-${uuidv4()}`;
    const event: CompanyCreatedEvent = {
      type: 'CompanyCreated',
      entity: 'company',
      aggregateId: newCompanyId,
      timestamp: new Date().toISOString(),
      payload: {
        id: newCompanyId,
        name: command.name,
      },
    };

    // 3. Save Event
    await saveEvents([event]);

    console.log('[Companies CommandHandler] created company', newCompanyId, { name: command.name });

    // 4. Return the created company (the live projection will be updated automatically)
    return { 
      id: newCompanyId, 
      name: command.name 
    };
  }
}