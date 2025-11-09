    
import type { Event } from '../teams/events';

export type TagAddedEvent = Event<
  'TagAdded',
  {
    radarItemId: string;
    radarName: string;
  }
> & { entity: 'initiative' };

export type TagRemovedEvent = Event<
  'TagRemoved',
  {
    radarItemId: string;
  }
> & { entity: 'initiative' };
