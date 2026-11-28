import { createAvatar } from '@dicebear/core';
import { thumbs } from '@dicebear/collection';

const cache = new Map();

export const getAvatarUrl = (user) => {
  if (user?.avatar) return user.avatar; // real uploads win later

  const seed = user?._id || user?.name || 'user';
  if (!cache.has(seed)) {
    cache.set(
      seed,
      createAvatar(thumbs, {
        seed,
        backgroundColor: ['111111', '1f1f1f', 'a80000'],
        shapeColor: ['ffffff', 'e5e5e5'],
      }).toDataUri()
    );
  }
  return cache.get(seed);
};