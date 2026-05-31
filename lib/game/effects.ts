import { StatusEffect, Entity } from './types';

export const applyEffect = (entity: Entity, effect: StatusEffect): void => {
  if (!entity.activeEffects) entity.activeEffects = [];
  const existing = entity.activeEffects.find((e) => e.type === effect.type);

  if (existing) {
    if (effect.type === 'might') {
      existing.stacks = Math.min((existing.stacks || 1) + 1, 3);
      existing.remainingTime = effect.duration;
      existing.magnitude = effect.magnitude * existing.stacks;
    } else {
      existing.remainingTime = effect.duration;
      existing.magnitude = effect.magnitude;
    }
  } else {
    entity.activeEffects.push({ ...effect, stacks: effect.stacks || 1 });
  }
};

export const updateEffects = (entity: Entity, deltaTime: number): void => {
  if (!entity.activeEffects) return;
  entity.activeEffects = entity.activeEffects.filter((e) => {
    e.remainingTime -= deltaTime;
    return e.remainingTime > 0;
  });
};

export const updateAllEntitiesEffects = (entities: Map<string, Entity>, deltaTime: number): void => {
  entities.forEach((entity) => {
    if (entity.activeEffects && entity.activeEffects.length > 0) {
      updateEffects(entity, deltaTime);
    }
  });
};
