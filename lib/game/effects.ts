import { StatusEffect, Entity } from './types';

export const updateAllEntitiesEffects = (entities: Map<string, Entity>, deltaTime: number): void => {
  entities.forEach((entity) => {
    if (!entity.activeEffects) return;
    entity.activeEffects = entity.activeEffects.filter((e) => {
      e.remainingTime -= deltaTime;
      return e.remainingTime > 0;
    });
  });
};
