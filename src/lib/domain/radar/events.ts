
export { type RadarItemCreatedEvent } from './RadarItemCreatedEvent';
export { type RadarItemUpdatedEvent } from './RadarItemUpdatedEvent';
export { type RadarItemDeletedEvent } from './RadarItemDeletedEvent';

import type { RadarItemCreatedEvent } from './RadarItemCreatedEvent';
import type { RadarItemUpdatedEvent } from './RadarItemUpdatedEvent';
import type { RadarItemDeletedEvent } from './RadarItemDeletedEvent';

export type RadarEvent =
  | RadarItemCreatedEvent
  | RadarItemUpdatedEvent
  | RadarItemDeletedEvent;