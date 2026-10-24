const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

let cachedFont;

function loadArabicFont() {
    if (cachedFont) return cachedFont;

    const windowsDir = process.env.WINDIR || 'C:\\Windows';
    const candidates = [
        process.env.POS_ARABIC_FONT,
        path.join(windowsDir, 'Fonts', 'tahoma.ttf'),
        path.join(windowsDir, 'Fonts', 'arial.ttf'),
        path.join(windowsDir, 'Fonts', 'segoeui.ttf'),
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    ].filter(Boolean);
    const fontPath = candidates.find((candidate) => fs.existsSync(candidate));
    if (!fontPath) {
        throw new Error('Arabic label printing requires Tahoma, Arial, Segoe UI, or POS_ARABIC_FONT.');
    }

    cachedFont = opentype.loadSync(fontPath);
    return cachedFont;
}

function curveSteps(points) {
    let distance = 0;
    for (let index = 1; index < points.length; index++) {
        distance += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
    }
    return Math.max(4, Math.min(24, Math.ceil(distance / 4)));
}

function flattenPath(commands, offsetX, offsetY) {
    const contours = [];
    let contour = [];
    let current = { x: 0, y: 0 };

    const addPoint = (x, y) => {
        const point = { x: x + offsetX, y: y + offsetY };
        contour.push(point);
        current = { x, y };
    };
    const closeContour = () => {
        if (contour.length > 2) contours.push(contour);
        contour = [];
    };

    for (const command of commands) {
        if (command.type === 'M') {
            closeContour();
            addPoint(command.x, command.y);
        } else if (command.type === 'L') {
            addPoint(command.x, command.y);
        } else if (command.type === 'Q') {
            const start = current;
            const steps = curveSteps([start, { x: command.x1, y: command.y1 }, { x: command.x, y: command.y }]);
            for (let step = 1; step <= steps; step++) {
                const t = step / steps;
                const inverse = 1 - t;
                addPoint(
                    inverse * inverse * start.x + 2 * inverse * t * command.x1 + t * t * command.x,
                    inverse * inverse * start.y + 2 * inverse * t * command.y1 + t * t * command.y,
                );
            }
        } else if (command.type === 'C') {
            const start = current;
            const steps = curveSteps([
                start,
                { x: command.x1, y: command.y1 },
                { x: command.x2, y: command.y2 },
                { x: command.x, y: command.y },
            ]);
            for (let step = 1; step <= steps; step++) {
                const t = step / steps;
                const inverse = 1 - t;
                addPoint(
                    inverse ** 3 * start.x + 3 * inverse * inverse * t * command.x1 + 3 * inverse * t * t * command.x2 + t ** 3 * command.x,
                    inverse ** 3 * start.y + 3 * inverse * inverse * t * command.y1 + 3 * inverse * t * t * command.y2 + t ** 3 * command.y,
                );
            }
        } else if (command.type === 'Z') {
            closeContour();
        }
    }
    closeContour();
    return contours;
}

function rasterizeContours(contours, width, height) {
    const widthBytes = Math.ceil(width / 8);
    const data = Buffer.alloc(widthBytes * height);

    for (let pixelY = 0; pixelY < height; pixelY++) {
        const scanY = pixelY + 0.5;
        const intersections = [];
        for (const contour of contours) {
            for (let index = 0; index < contour.length; index++) {
                const first = contour[index];
                const second = contour[(index + 1) % contour.length];
                if ((first.y <= scanY && second.y > scanY) || (second.y <= scanY && first.y > scanY)) {
                    intersections.push(first.x + ((scanY - first.y) * (second.x - first.x)) / (second.y - first.y));
                }
            }
        }
        intersections.sort((a, b) => a - b);

        for (let index = 0; index + 1 < intersections.length; index += 2) {
            const start = Math.max(0, Math.ceil(intersections[index] - 0.5));
            const end = Math.min(width - 1, Math.floor(intersections[index + 1] - 0.5));
            for (let pixelX = start; pixelX <= end; pixelX++) {
                data[pixelY * widthBytes + Math.floor(pixelX / 8)] |= 0x80 >> (pixelX % 8);
            }
        }
    }

    return { widthBytes, height, data };
}

function renderTextBitmap(text, maxWidth, maxHeight) {
    const font = loadArabicFont();
    const referenceSize = 100;
    const referencePath = font.getPath(text, 0, referenceSize, referenceSize);
    const referenceBox = referencePath.getBoundingBox();
    const referenceWidth = Math.max(1, referenceBox.x2 - referenceBox.x1);
    const referenceHeight = Math.max(1, referenceBox.y2 - referenceBox.y1);
    const fontSize = referenceSize * Math.min((maxWidth - 2) / referenceWidth, (maxHeight - 2) / referenceHeight);

    const glyphPath = font.getPath(text, 0, fontSize, fontSize);
    const box = glyphPath.getBoundingBox();
    const width = Math.max(1, Math.min(maxWidth, Math.ceil(box.x2 - box.x1) + 2));
    const height = Math.max(1, Math.min(maxHeight, Math.ceil(box.y2 - box.y1) + 2));
    const contours = flattenPath(glyphPath.commands, -box.x1 + 1, -box.y1 + 1);

    return rasterizeContours(contours, width, height);
}

module.exports = { renderTextBitmap };
