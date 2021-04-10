import { EventTypes } from './eventTypes';

export const DomEvents = Object.values(EventTypes).map((eventType) => {
  return `on${eventType}`;
});
