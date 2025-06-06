export function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

export function getDistanceSquared(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}

export function checkCircleCollision(obj1, obj2) {
    const distanceSquared = getDistanceSquared(obj1.x, obj1.y, obj2.x, obj2.y);
    const radiusSum = (obj1.radius || 0) + (obj2.radius || 0);
    return distanceSquared <= radiusSum * radiusSum;
}

export function isInViewport(x, y, cameraOffset, width, height, buffer = 100) {
    return (x >= cameraOffset.x - buffer) && 
           (x <= cameraOffset.x + width + buffer) && 
           (y >= cameraOffset.y - buffer) && 
           (y <= cameraOffset.y + height + buffer);
}