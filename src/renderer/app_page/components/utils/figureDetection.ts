import type { Figure, FigureInfo, Point } from '../types';
import {
  pointToSegmentDistance,
  segmentsIntersect,
  applySoftSnap,
  applyAspectRatioLock,
  calcPointsArrow,
  calcSegmentsFlatArrow,
  getCornersWithMargin,
  calculateCanvasTextMinWidth,
  calculateCanvasWrappedTextHeight,
  getTextAutoResizeHandle,
} from './general';

import {
  dotTextMargin,
  figureMinScale,
  widthList,
  dotHoverRadius,
  sideHoverTolerance,
} from '../constants'

const withinRadius = (x: number, y: number) => {
  const radius = dotHoverRadius

  return (point: Point) => {
    const [pointX, pointY] = point;

    return Math.hypot(pointX - x, pointY - y) <= radius;
  }
}

const isOnCurve = (x: number, y: number, points: Point[], tolerance: number) => {
  for (let i = 0; i < points.length - 1; i++) {
    const pointA = points[i];
    const pointB = points[i + 1];

    const distance = pointToSegmentDistance(x, y, pointA, pointB);

    if (distance <= tolerance) {
      return true;
    }
  }

  return false
}

const sampleQuadraticCurve = (startPoint: Point, controlPoint: Point, endPoint: Point) => {
  const steps = 6;
  const points = [];

  for (let step = 1; step <= steps; step++) {
    const t = step / steps;
    const oneMinusT = 1 - t;

    points.push([
      oneMinusT ** 2 * startPoint[0] + 2 * oneMinusT * t * controlPoint[0] + t ** 2 * endPoint[0],
      oneMinusT ** 2 * startPoint[1] + 2 * oneMinusT * t * controlPoint[1] + t ** 2 * endPoint[1],
    ]);
  }

  return points;
}

const sampleCubicCurve = (startPoint: Point, firstControlPoint: Point, secondControlPoint: Point, endPoint: Point) => {
  const steps = 6;
  const points = [];

  for (let step = 1; step <= steps; step++) {
    const t = step / steps;
    const oneMinusT = 1 - t;

    points.push([
      oneMinusT ** 3 * startPoint[0] + 3 * oneMinusT ** 2 * t * firstControlPoint[0] + 3 * oneMinusT * t ** 2 * secondControlPoint[0] + t ** 3 * endPoint[0],
      oneMinusT ** 3 * startPoint[1] + 3 * oneMinusT ** 2 * t * firstControlPoint[1] + 3 * oneMinusT * t ** 2 * secondControlPoint[1] + t ** 3 * endPoint[1],
    ]);
  }

  return points;
}

const getRectanglePoints = (figure: Figure) => {
  const { points: [pointA, pointB], edgeIndex } = figure

  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  const left   = Math.min(startX, endX);
  const right  = Math.max(startX, endX);
  const top    = Math.min(startY, endY);
  const bottom = Math.max(startY, endY);

  const topLeftCorner     = [left, top];
  const topRightCorner    = [right, top];
  const bottomRightCorner = [right, bottom];
  const bottomLeftCorner  = [left, bottom];

  if (edgeIndex === 0) {
    return [
      topLeftCorner,
      topRightCorner,
      bottomRightCorner,
      bottomLeftCorner,
      topLeftCorner,
    ];
  }

  const radius = Math.min(Math.min(right - left, bottom - top) * 0.25, 32);

  const topLeftCornerStart     = [left,          top + radius];
  const topLeftCornerEnd       = [left + radius, top];

  const topRightCornerStart    = [right - radius, top];
  const topRightCornerEnd      = [right,          top + radius];

  const bottomRightCornerStart = [right,          bottom - radius];
  const bottomRightCornerEnd   = [right - radius, bottom];

  const bottomLeftCornerStart  = [left + radius, bottom];
  const bottomLeftCornerEnd    = [left,          bottom - radius];

  return [
    topLeftCornerEnd,
    topRightCornerStart,
    ...sampleQuadraticCurve((topRightCornerStart as Point), topRightCorner, topRightCornerEnd),
    bottomRightCornerStart,
    ...sampleQuadraticCurve((bottomRightCornerStart as Point), bottomRightCorner, bottomRightCornerEnd),
    bottomLeftCornerStart,
    ...sampleQuadraticCurve((bottomLeftCornerStart as Point), bottomLeftCorner, bottomLeftCornerEnd),
    topLeftCornerStart,
    ...sampleQuadraticCurve((topLeftCornerStart as Point), topLeftCorner, topLeftCornerEnd),
  ];
}

const getDiamondPoints = (figure: Figure) => {
  const { points: [pointA, pointB], edgeIndex } = figure

  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  const centerX = (startX + endX) / 2;
  const centerY = (startY + endY) / 2;

  const topCorner    = [centerX, Math.min(startY, endY)];
  const rightCorner  = [Math.max(startX, endX), centerY];
  const bottomCorner = [centerX, Math.max(startY, endY)];
  const leftCorner   = [Math.min(startX, endX), centerY];

  if (edgeIndex === 0) {
    return [
      topCorner,
      rightCorner,
      bottomCorner,
      leftCorner,
      topCorner
    ];
  }

  const offsetX = (rightCorner[0] - leftCorner[0]) / 8;
  const offsetY = (bottomCorner[1] - topCorner[1]) / 8;

  const topCornerStart    = [topCorner[0] - offsetX, topCorner[1] + offsetY];
  const topCornerEnd      = [topCorner[0] + offsetX, topCorner[1] + offsetY];

  const rightCornerStart  = [rightCorner[0] - offsetX, rightCorner[1] - offsetY];
  const rightCornerEnd    = [rightCorner[0] - offsetX, rightCorner[1] + offsetY];

  const bottomCornerStart = [bottomCorner[0] + offsetX, bottomCorner[1] - offsetY];
  const bottomCornerEnd   = [bottomCorner[0] - offsetX, bottomCorner[1] - offsetY];

  const leftCornerStart   = [leftCorner[0] + offsetX, leftCorner[1] + offsetY];
  const leftCornerEnd     = [leftCorner[0] + offsetX, leftCorner[1] - offsetY];

  return [
    topCornerEnd,
    rightCornerStart,
    ...sampleCubicCurve((rightCornerStart as Point), rightCorner, rightCorner, rightCornerEnd),
    bottomCornerStart,
    ...sampleCubicCurve((bottomCornerStart as Point), bottomCorner, bottomCorner, bottomCornerEnd),
    leftCornerStart,
    ...sampleCubicCurve((leftCornerStart as Point), leftCorner, leftCorner, leftCornerEnd),
    topCornerStart,
    ...sampleCubicCurve((topCornerStart as Point), topCorner, topCorner, topCornerEnd),
  ];
}

const isOnLine = (x: number, y: number, figure: Figure) => {
  const { points, widthIndex } = figure

  const baseTolerance = 5;
  const tolerance = baseTolerance + widthList[widthIndex].figure_width / 2

  return isOnCurve(x, y, points, tolerance)
}

const isOnPolygon = (x: number, y: number, points: Point[]) => {
  let isInside = false
  const total = points.length

  for (let current = 0; current < total; current++) {
    const prev = current === 0 ? total - 1 : current - 1

    const currPoint = points[current]
    const prevPoint = points[prev]

    const cx = currPoint[0]
    const cy = currPoint[1]
    const px = prevPoint[0]
    const py = prevPoint[1]

    const crossesRay = (cy > y) !== (py > y)
    if (!crossesRay) continue

    const intersectX = ((px - cx) * (y - cy)) / (py - cy) + cx

    if (x < intersectX) {
      isInside = !isInside
    }
  }

  return isInside
}

const isOnArrow = (x: number, y: number, figure: Figure) => {
  const { points, widthIndex } = figure

  const figurePoints = calcPointsArrow(points, widthIndex)

  return isOnPolygon(x, y, (figurePoints as Point[]))
}

const isOnFlatArrow = (x: number, y: number, figure: Figure) => {
  const { points, widthIndex } = figure

  const baseTolerance = 5;
  const tolerance = baseTolerance + widthList[widthIndex].figure_width / 2

  const [shaftSegment, headTopSegment, headBottomSegment] = calcSegmentsFlatArrow(points, widthIndex)

  const shaftDistance      = pointToSegmentDistance(x, y, (shaftSegment[0] as Point), shaftSegment[1]);
  const headTopDistance    = pointToSegmentDistance(x, y, (headTopSegment[0] as Point), headTopSegment[1]);
  const headBottomDistance = pointToSegmentDistance(x, y, (headBottomSegment[0] as Point), headBottomSegment[1]);

  const closeToShaft      = shaftDistance <= tolerance;
  const closeToHeadTop    = headTopDistance <= tolerance;
  const closeToHeadBottom = headBottomDistance <= tolerance;

  return (closeToShaft || closeToHeadTop || closeToHeadBottom)
}

const isOnOval = (x: number, y: number, figure: Figure) => {
  const { points } = figure

  const [startX, startY] = points[0];
  const [endX, endY] = points[1];

  const radiusX = Math.abs(endX - startX) / 2;
  const radiusY = Math.abs(endY - startY) / 2;
  const centerX = Math.min(startX, endX) + radiusX;
  const centerY = Math.min(startY, endY) + radiusY;

  // If the oval is too narrow, treat it as a line
  if (radiusX < 5 || radiusY < 5) {
    return isOnLine(x, y, figure)
  }

  const normalizedX = (x - centerX) / radiusX;
  const normalizedY = (y - centerY) / radiusY;

  const ellipseValue = normalizedX * normalizedX + normalizedY * normalizedY;

  const distance = Math.abs(ellipseValue - 1);
  const tolerance = 0.15;

  if (distance <= tolerance) {
    return true
  }

  return false
}

const isOnRectangle = (x: number, y: number, figure: Figure) => {
  const { widthIndex } = figure

  const baseTolerance = 5;
  const tolerance = baseTolerance + widthList[widthIndex].figure_width / 2

  const rectanglePoints = getRectanglePoints(figure);

  return isOnCurve(x, y, (rectanglePoints as Point[]), tolerance);
}

const isOnDiamond = (x: number, y: number, figure: Figure) => {
  const baseTolerance = 5;
  const tolerance = baseTolerance + widthList[figure.widthIndex].figure_width / 2;

  const diamondPoints = getDiamondPoints(figure);

  return isOnCurve(x, y, (diamondPoints as Point[]), tolerance);
}

const isOverText = (x: number, y: number, figure: Figure) => {
  const { points, width, height, scale } = figure
  const startAt = points[0]

  const minX = startAt[0] - dotTextMargin;
  const maxX = startAt[0] + width * scale + dotTextMargin;
  const minY = startAt[1] - dotTextMargin;
  const maxY = startAt[1] + height * scale + dotTextMargin;

  const withinHorizontalBounds = x >= minX && x <= maxX;
  const withinVerticalBounds = y >= minY && y <= maxY;

  if (withinHorizontalBounds && withinVerticalBounds) {
    return true
  }

  return false
}

const isOnTwoDots = (x: number, y: number, figure: Figure) => {
  const [pointA, pointB] = figure.points;

  const inRadius = withinRadius(x, y)

  if (inRadius(pointA)) return 'pointA'
  if (inRadius(pointB)) return 'pointB'

  return null
}

const isOnFourDots = (x: number, y: number, figure: Figure) => {
  const [pointA, pointB] = figure.points;

  return getDotNameByPoints(x, y, pointA, pointB);
}

const isOnTextDots = (x: number, y: number, figure: Figure) => {
  const { points, width, height, scale } = figure
  const startAt = points[0];

  const endAt = [
    startAt[0] + width * scale,
    startAt[1] + height * scale,
  ];

  return getDotNameByPoints(x, y, startAt, (endAt as Point))
}

const getDotNameByPoints = (x: number, y: number, pointA: Point, pointB: Point) => {
  const { pointAwithMargin, pointBwithMargin, pointCwithMargin, pointDwithMargin } = getCornersWithMargin(pointA, pointB)

  const inRadius = withinRadius(x, y)

  if (inRadius((pointAwithMargin as Point))) return 'pointA'
  if (inRadius((pointBwithMargin as Point))) return 'pointB'
  if (inRadius((pointCwithMargin as Point))) return 'pointC'
  if (inRadius((pointDwithMargin as Point))) return 'pointD'

  return null
}

const getSideNameByPoints = (x: number, y: number, pointA: Point, pointB: Point) => {
  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  const minX = Math.min(startX, endX) - dotTextMargin;
  const maxX = Math.max(startX, endX) + dotTextMargin;
  const minY = Math.min(startY, endY) - dotTextMargin;
  const maxY = Math.max(startY, endY) + dotTextMargin;

  const distLeft   = Math.abs(x - minX);
  const distRight  = Math.abs(x - maxX);
  const distTop    = Math.abs(y - minY);
  const distBottom = Math.abs(y - maxY);

  const withinHorizontalBounds = x >= minX && x <= maxX;
  const withinVerticalBounds = y >= minY && y <= maxY;

  const closeToTopEdge    = distTop <= sideHoverTolerance && withinHorizontalBounds;
  const closeToBottomEdge = distBottom <= sideHoverTolerance && withinHorizontalBounds;
  const closeToLeftEdge   = distLeft <= sideHoverTolerance && withinVerticalBounds;
  const closeToRightEdge  = distRight <= sideHoverTolerance && withinVerticalBounds;

  if (closeToTopEdge)    return 'TopSide'
  if (closeToBottomEdge) return 'BottomSide'
  if (closeToLeftEdge)   return 'LeftSide'
  if (closeToRightEdge)  return 'RightSide'

  return null
}

const isOnFigureSide = (x: number, y: number, figure: Figure) => {
  const [pointA, pointB] = figure.points;

  return getSideNameByPoints(x, y, pointA, pointB);
}

const isOnTextSide = (x: number, y: number, figure: Figure) => {
  const { points, width, height, scale } = figure;
  const startAt = points[0];

  const endAt = [
    startAt[0] + width * scale,
    startAt[1] + height * scale,
  ];

  return getSideNameByPoints(x, y, startAt, (endAt as Point));
}

export const isOnFigure = (x: number, y: number, figure: Figure) => {
  switch (figure.type) {
    case 'arrow':
      return isOnArrow(x, y, figure)
    case 'flat_arrow':
      return isOnFlatArrow(x, y, figure)
    case 'rectangle':
      return isOnRectangle(x, y, figure)
    case 'diamond':
      return isOnDiamond(x, y, figure)
    case 'oval':
      return isOnOval(x, y, figure)
    case 'line':
      return isOnLine(x, y, figure)
    case 'text':
      return isOverText(x, y, figure)
    default:
      return false
  }
}

export const isOnTextAutoResizeHandle = (x: number, y: number, figure: Figure) => {
  if (figure.type !== 'text') return false;
  if (figure.autoResize) return false;

  const handle = getTextAutoResizeHandle(figure);
  if (!handle) return false;

  return isOnCurve(x, y, [handle.startAt, handle.endAt], sideHoverTolerance);
}

const isOverRectangle = (x: number, y: number, figure: Figure) => {
  const rectanglePoints = getRectanglePoints(figure);

  return isOnPolygon(x, y, (rectanglePoints as Point[]));
}

const isOverDiamond = (x: number, y: number, figure: Figure) => {
  const diamondPoints = getDiamondPoints(figure);

  return isOnPolygon(x, y, (diamondPoints as Point[]));
}

const isOverOval = (x: number, y: number, figure: Figure) => {
  const { points } = figure

  const [startX, startY] = points[0];
  const [endX, endY] = points[1];

  const radiusX = Math.abs(endX - startX) / 2;
  const radiusY = Math.abs(endY - startY) / 2;
  const centerX = Math.min(startX, endX) + radiusX;
  const centerY = Math.min(startY, endY) + radiusY;

  const normalizedX = (x - centerX) / radiusX;
  const normalizedY = (y - centerY) / radiusY;

  const ellipseValue = normalizedX * normalizedX + normalizedY * normalizedY;

  return ellipseValue <= 1;
}

export const isOverFigure = (x: number, y: number, figure: Figure) => {
  switch (figure.type) {
    case 'rectangle':
      return isOverRectangle(x, y, figure)
    case 'diamond':
      return isOverDiamond(x, y, figure)
    case 'oval':
      return isOverOval(x, y, figure)
    case 'text':
      return isOverText(x, y, figure)
    default:
      return false
  }
}

const isSegmentIntersectCurve = (segmentPoints: Point[], points: Point[]) => {
  if (segmentPoints.length < 2) {
    return false
  }

  const [startAt, endAt] = segmentPoints.slice(-2);

  for (let i = 0; i < points.length - 1; i++) {
    const pointA = points[i];
    const pointB = points[i + 1];

    if (segmentsIntersect(startAt, endAt, pointA, pointB)) {
      return true;
    }
  }

  return false;
}

const isSegmentTouchCurve = (segmentPoints: Point[], figure: Figure) => {
  const { points } = figure
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1)!;

  const tolerance = 10

  if (points.length < 2) {
    const [pointX, pointY] = points[0];

    const distance = Math.hypot(eraseAtX - pointX, eraseAtY - pointY);

    return distance <= tolerance
  }

  if (isOnCurve(eraseAtX, eraseAtY, points, tolerance)) {
    return true
  }

  return isSegmentIntersectCurve(segmentPoints, points)
}

const isSegmentTouchLine = (segmentPoints: Point[], figure: Figure) => {
  const { points } = figure
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1)!;

  if (isOnLine(eraseAtX, eraseAtY, figure)) {
    return true
  }

  return isSegmentIntersectCurve(segmentPoints, points)
}

const isSegmentTouchArrow = (segmentPoints: Point[], figure: Figure) => {
  const { points } = figure
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1)!;

  if (isOnArrow(eraseAtX, eraseAtY, figure)) {
    return true
  }

  const figurePoints = calcPointsArrow(points, figure.widthIndex)

  return isSegmentIntersectCurve(segmentPoints, (figurePoints as Point[]))
}

const isSegmentTouchFlatArrow = (segmentPoints: Point[], figure: Figure) => {
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1)!;

  if (isOnFlatArrow(eraseAtX, eraseAtY, figure)) {
    return true
  }

  const [shaftSegment, headTopSegment, headBottomSegment] = calcSegmentsFlatArrow(figure.points, figure.widthIndex)

  return isSegmentIntersectCurve(segmentPoints, (shaftSegment as Point[])) ||
         isSegmentIntersectCurve(segmentPoints, (headTopSegment as Point[])) ||
         isSegmentIntersectCurve(segmentPoints, (headBottomSegment as Point[]))
}

const isSegmentTouchRectangle = (segmentPoints: Point[], figure: Figure) => {
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1)!;

  if (isOnRectangle(eraseAtX, eraseAtY, figure)) {
    return true
  }

  const rectanglePoints = getRectanglePoints(figure);

  return isSegmentIntersectCurve(segmentPoints, (rectanglePoints as Point[]))
}

const isSegmentTouchText = (segmentPoints: Point[], figure: Figure) => {
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1)!;

  if (isOverText(eraseAtX, eraseAtY, figure)) {
    return true
  }

  const { points, width, height, scale } = figure
  const startAt = points[0];

  const rectPoints = [
    [startAt[0],                 startAt[1]],
    [startAt[0] + width * scale, startAt[1]],
    [startAt[0] + width * scale, startAt[1] + height * scale],
    [startAt[0],                 startAt[1] + height * scale],
    [startAt[0],                 startAt[1]],
  ];

  return isSegmentIntersectCurve(segmentPoints, (rectPoints as Point[]))
}

const isSegmentTouchOval = (segmentPoints: Point[], figure: Figure) => {
  const { points } = figure
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1)!;

  if (isOnOval(eraseAtX, eraseAtY, figure)) {
    return true
  }

  const [startX, startY] = points[0];
  const [endX, endY] = points[1];

  const numPoints = 32;
  const ovalPoints = [];

  const radiusX = Math.abs(endX - startX) / 2;
  const radiusY = Math.abs(endY - startY) / 2;
  const centerX = Math.min(startX, endX) + radiusX;
  const centerY = Math.min(startY, endY) + radiusY;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const x = centerX + radiusX * Math.cos(angle);
    const y = centerY + radiusY * Math.sin(angle);
    ovalPoints.push([x, y]);
  }

  ovalPoints.push(ovalPoints[0]);

  return isSegmentIntersectCurve(segmentPoints, (ovalPoints as Point[]))
}

const isSegmentTouchDiamond = (segmentPoints: Point[], figure: Figure) => {
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1)!;

  if (isOnDiamond(eraseAtX, eraseAtY, figure)) {
    return true
  }

  const diamondPoints = getDiamondPoints(figure);

  return isSegmentIntersectCurve(segmentPoints, (diamondPoints as Point[]))
}

export const areFiguresIntersecting = (eraserFigure: Figure, figure: Figure) => {
  switch (figure.type) {
    case 'brush':
    case 'pen':
    case 'fadepen':
    case 'highlighter':
      return isSegmentTouchCurve(eraserFigure.points, figure)
    case 'arrow':
      return isSegmentTouchArrow(eraserFigure.points, figure)
    case 'flat_arrow':
      return isSegmentTouchFlatArrow(eraserFigure.points, figure)
    case 'rectangle':
      return isSegmentTouchRectangle(eraserFigure.points, figure)
    case 'diamond':
      return isSegmentTouchDiamond(eraserFigure.points, figure)
    case 'oval':
      return isSegmentTouchOval(eraserFigure.points, figure)
    case 'line':
      return isSegmentTouchLine(eraserFigure.points, figure)
    case 'text':
      return isSegmentTouchText(eraserFigure.points, figure)
    default:
      return false
  }
}

export const getDotNameOnFigure = (x: number, y: number, figure: Figure) => {
  switch (figure.type) {
    case 'line':
    case 'arrow':
    case 'flat_arrow':
      return isOnTwoDots(x, y, figure) // ['pointA', 'pointB', null]
    case 'rectangle':
    case 'diamond':
    case 'oval':
      return isOnFourDots(x, y, figure) // ['pointA', 'pointB', 'pointC', 'pointD', null]
    case 'text':
      return isOnTextDots(x, y, figure) // ['pointA', 'pointB', 'pointC', 'pointD', null]
    default:
      return null
  }
};

export const getSideNameOnFigure = (x: number, y: number, figure: Figure) => {
  switch (figure.type) {
    case 'rectangle':
    case 'diamond':
    case 'oval':
      return isOnFigureSide(x, y, figure) // ['TopSide', 'BottomSide', 'LeftSide', 'RightSide', null]
    case 'text':
      return isOnTextSide(x, y, figure) // ['TopSide', 'BottomSide', 'LeftSide', 'RightSide', null]
    default:
      return null
  }
};

const getDotCoordinates = (figure: Figure, dotName: string) => {
  if (['line', 'arrow', 'flat_arrow'].includes(figure.type)) {
    if (dotName === 'pointA') return figure.points[0];
    if (dotName === 'pointB') return figure.points[1];
  }

  if (['rectangle', 'diamond', 'oval'].includes(figure.type)) {
    const [pointA, pointB] = figure.points;

    if (dotName === 'pointA') return pointA;
    if (dotName === 'pointB') return pointB;
    if (dotName === 'pointC') return [pointA[0], pointB[1]];
    if (dotName === 'pointD') return [pointB[0], pointA[1]];
  }

  if (['text'].includes(figure.type)) {
    const startAt = figure.points[0];
    const startX = startAt[0];
    const startY = startAt[1];
    const endX = startAt[0] + figure.width * figure.scale;
    const endY = startAt[1] + figure.height * figure.scale;

    if (dotName === 'pointA') return [startX, startY];
    if (dotName === 'pointB') return [endX, endY];
    if (dotName === 'pointC') return [startX, endY];
    if (dotName === 'pointD') return [endX, startY];
  }

  return null;
}

export const getDotOffsetCoordinates = (figure: Figure, dotName: string, x: number, y: number) => {
  const dotCoordinates = getDotCoordinates(figure, dotName);

  if (!dotCoordinates) {
    return {
      offsetX: 0,
      offsetY: 0,
    };
  }

  return {
    offsetX: x - dotCoordinates[0],
    offsetY: y - dotCoordinates[1],
  };
}

export const getSidePointName = (figure: Figure, sideName: string) => {
  if (['text'].includes(figure.type)) {
    if (sideName === 'TopSide')    return 'pointAScale'
    if (sideName === 'BottomSide') return 'pointBScale'
    if (sideName === 'LeftSide')   return 'pointAWidth'
    if (sideName === 'RightSide')  return 'pointBWidth'

    return null;
  }

  if (['rectangle', 'diamond', 'oval'].includes(figure.type)) {
    const [pointA, pointB] = figure.points;

    if (sideName === 'TopSide')    return pointA[1] <= pointB[1] ? 'pointA' : 'pointB';
    if (sideName === 'BottomSide') return pointA[1] <= pointB[1] ? 'pointB' : 'pointA';
    if (sideName === 'LeftSide')   return pointA[0] <= pointB[0] ? 'pointA' : 'pointB';
    if (sideName === 'RightSide')  return pointA[0] <= pointB[0] ? 'pointB' : 'pointA';
  }

  return null;
}

export const getSideOffsetCoordinates = (figure: Figure, sideName: any, sidePointName: any, x: number, y: number) => {
  if (!sidePointName) {
    return {
      offsetX: 0,
      offsetY: 0,
    };
  }

  if (['text'].includes(figure.type)) {
    const { points: [startAt], scale, width, height } = figure;

    const [startX, startY] = startAt;

    const endX = startX + width * scale;
    const endY = startY + height * scale;

    if (sidePointName === 'pointAScale') {
      return {
        offsetX: 0,
        offsetY: y - startY,
      };
    }

    if (sidePointName === 'pointBScale') {
      return {
        offsetX: 0,
        offsetY: y - endY,
      };
    }

    if (sidePointName === 'pointAWidth') {
      return {
        offsetX: x - startX,
        offsetY: 0,
      };
    }

    if (sidePointName === 'pointBWidth') {
      return {
        offsetX: x - endX,
        offsetY: 0,
      };
    }
  }

  if (['rectangle', 'diamond', 'oval'].includes(figure.type)) {
    const sidePoint = sidePointName === 'pointA' ? figure.points[0] : figure.points[1];

    if (['TopSide', 'BottomSide'].includes(sideName)) {
      return {
        offsetX: 0,
        offsetY: y - sidePoint[1],
      };
    }

    if (['LeftSide', 'RightSide'].includes(sideName)) {
      return {
        offsetX: x - sidePoint[0],
        offsetY: 0,
      };
    }
  }

  return {
    offsetX: 0,
    offsetY: 0,
  };
}

export const dragFigure = (figure: Figure, oldCoordinates: any, newCoordinates: any) => {
  const offsetX = newCoordinates.x - oldCoordinates.x;
  const offsetY = newCoordinates.y - oldCoordinates.y;

  figure.points.forEach((point: Point) => {
    point[0] += offsetX
    point[1] += offsetY
  })
}

const textPointCoordinates = {
  pointA: (f: Figure) => [
    f.points[0][0],
    f.points[0][1],
  ],
  pointB: (f: Figure) => [
    f.points[0][0] + f.width * f.scale,
    f.points[0][1] + f.height * f.scale,
  ],
  pointC: (f: Figure) => [
    f.points[0][0],
    f.points[0][1] + f.height * f.scale,
  ],
  pointD: (f: Figure) => [
    f.points[0][0] + f.width * f.scale,
    f.points[0][1]
  ],
};

const resizeLineByDots = (figure: Figure, activeFigureInfo: FigureInfo, { x, y, isShiftPressed }: { x: number; y: number; isShiftPressed: boolean }) => {
  const { resizingDotName } = activeFigureInfo;

  if (isShiftPressed) {
    let pointA = figure.points[0];
    let pointB = figure.points[1];

    let startPoint

    if (resizingDotName === 'pointA') { startPoint = pointB; }
    if (resizingDotName === 'pointB') { startPoint = pointA; }

    const result = applySoftSnap(startPoint![0], startPoint![1], x, y);

    x = result.x;
    y = result.y;
  }

  switch (resizingDotName) {
    case 'pointA':
      figure.points[0][0] = x
      figure.points[0][1] = y
      break;
    case 'pointB':
      figure.points[1][0] = x
      figure.points[1][1] = y
      break;
  }
}

const resizeShapeByDots = (figure: Figure, activeFigureInfo: FigureInfo, { x, y, isShiftPressed }: { x: number; y: number; isShiftPressed: boolean }) => {
  const { resizingDotName } = activeFigureInfo;

  if (isShiftPressed) {
    let pointA = figure.points[0];
    let pointB = figure.points[1];
    let pointC = [figure.points[0][0], figure.points[1][1]];
    let pointD = [figure.points[1][0], figure.points[0][1]];

    let startPoint

    if (resizingDotName === 'pointA') { startPoint = pointB; }
    if (resizingDotName === 'pointB') { startPoint = pointA; }
    if (resizingDotName === 'pointC') { startPoint = pointD; }
    if (resizingDotName === 'pointD') { startPoint = pointC; }

    const result = applyAspectRatioLock(startPoint![0], startPoint![1], x, y, figure.ratio);

    x = result.x;
    y = result.y;
  }

  switch (resizingDotName) {
    case 'pointA':
      figure.points[0][0] = x
      figure.points[0][1] = y
      break;
    case 'pointB':
      figure.points[1][0] = x
      figure.points[1][1] = y
      break;
    case 'pointC':
      figure.points[0][0] = x
      figure.points[1][1] = y
      break;
    case 'pointD':
      figure.points[1][0] = x
      figure.points[0][1] = y
      break;
  }
}

const resizeTextByDots = (figure: Figure, activeFigureInfo: FigureInfo, { x, y }: { x: number; y: number; isShiftPressed?: boolean }) => {
  const { resizingDotName } = activeFigureInfo;

  switch (resizingDotName) {
    case 'pointA': {
      const [pointX, pointY] = textPointCoordinates.pointA(figure);

      const dx = (pointX - x) / figure.width;
      const dy = (pointY - y) / figure.height;

      const delta = Math.max(dx, dy);
      const newScale = Math.max(figureMinScale, figure.scale + delta);

      const scaleDiff = newScale - figure.scale;

      figure.points[0][0] -= figure.width * scaleDiff;
      figure.points[0][1] -= figure.height * scaleDiff;
      figure.scale = newScale;
      break;
    }
    case 'pointB': {
      const [pointX, pointY] = textPointCoordinates.pointB(figure);

      const dx = (x - pointX) / figure.width;
      const dy = (y - pointY) / figure.height;

      const delta = Math.max(dx, dy);
      const newScale = Math.max(figureMinScale, figure.scale + delta);

      figure.scale = newScale
      break;
    }
    case 'pointC': {
      const [pointX, pointY] = textPointCoordinates.pointC(figure);

      const dx = (pointX - x) / figure.width;
      const dy = (y - pointY) / figure.height;

      const delta = Math.max(dx, dy);
      const newScale = Math.max(figureMinScale, figure.scale + delta);

      const scaleDiff = newScale - figure.scale;

      figure.points[0][0] -= figure.width * scaleDiff;
      figure.scale = newScale;
      break;
    }
    case 'pointD': {
      const [pointX, pointY] = textPointCoordinates.pointD(figure);

      const dx = (x - pointX) / figure.width;
      const dy = (pointY - y) / figure.height;

      const delta = Math.max(dx, dy);
      const newScale = Math.max(figureMinScale, figure.scale + delta);

      const scaleDiff = newScale - figure.scale;

      figure.points[0][1] -= figure.height * scaleDiff;
      figure.scale = newScale;
      break;
    }
  }
}

const resizeFigureByDot = (figure: Figure, activeFigureInfo: FigureInfo, { x, y, isShiftPressed }: { x: number; y: number; isShiftPressed: boolean }) => {
  if (['line', 'arrow', 'flat_arrow'].includes(figure.type)) {
    resizeLineByDots(figure, activeFigureInfo, { x, y, isShiftPressed });
    return;
  }

  if (['rectangle', 'diamond', 'oval'].includes(figure.type)) {
    resizeShapeByDots(figure, activeFigureInfo, { x, y, isShiftPressed });
    return;
  }

  if (['text'].includes(figure.type)) {
    resizeTextByDots(figure, activeFigureInfo, { x, y, isShiftPressed });
    return;
  }
}

const resizeTextBySide = (figure: Figure, activeFigureInfo: FigureInfo, { x, y }: { x: number; y: number }) => {
  const { resizingSidePointName } = activeFigureInfo;

  // Зберігаємо bottom-right на місці
  if (resizingSidePointName === 'pointAScale') {
    const [, anchorY] = textPointCoordinates.pointB(figure);

    const dy = (anchorY - y) / figure.height;

    const newScale = Math.max(figureMinScale, dy);

    const scaleDiff = newScale - figure.scale;

    figure.points[0][0] -= figure.width * scaleDiff;
    figure.points[0][1] -= figure.height * scaleDiff;
    figure.scale = newScale;
    return;
  }

  // Зберігаємо top-left на місці
  if (resizingSidePointName === 'pointBScale') {
    const [, anchorY] = textPointCoordinates.pointA(figure);

    const dy = (y - anchorY) / figure.height;

    const newScale = Math.max(figureMinScale, dy);

    figure.scale = newScale;
    return;
  }

  if (resizingSidePointName === 'pointAWidth') {
    const [anchorX] = textPointCoordinates.pointB(figure);

    const dx = (anchorX - x) / figure.scale;

    const minWidth = calculateCanvasTextMinWidth(figure.widthIndex);

    const newWidth = Math.max(minWidth, dx);
    const newHeight = calculateCanvasWrappedTextHeight(figure.text, figure.widthIndex, newWidth);

    figure.points[0][0] = anchorX - newWidth * figure.scale;
    figure.width = newWidth;
    figure.height = newHeight;
    figure.autoResize = false;
    return;
  }

  if (resizingSidePointName === 'pointBWidth') {
    const [anchorX] = textPointCoordinates.pointA(figure);

    const dx = (x - anchorX) / figure.scale;

    const minWidth = calculateCanvasTextMinWidth(figure.widthIndex);

    const newWidth = Math.max(minWidth, dx);
    const newHeight = calculateCanvasWrappedTextHeight(figure.text, figure.widthIndex, newWidth);

    figure.width = newWidth;
    figure.height = newHeight;
    figure.autoResize = false;
    return;
  }
}

const resizeShapeBySide = (figure: Figure, activeFigureInfo: FigureInfo, { x, y, isShiftPressed }: { x: number; y: number; isShiftPressed: boolean }) => {
  const { resizingSideName, resizingSidePointName } = activeFigureInfo;

  const [pointA, pointB] = figure.points;
  const resizingPoint = resizingSidePointName === 'pointA' ? pointA : pointB;

  if (['TopSide', 'BottomSide'].includes(resizingSideName)) {
    resizingPoint[1] = y;

    if (isShiftPressed) {
      const centerX = (pointA[0] + pointB[0]) / 2;
      const directionX = pointA[0] <= pointB[0] ? 1 : -1;
      const width = Math.abs(pointB[1] - pointA[1]) * figure.ratio;

      pointA[0] = centerX - directionX * width / 2;
      pointB[0] = centerX + directionX * width / 2;
    }

    return;
  }

  if (['LeftSide', 'RightSide'].includes(resizingSideName)) {
    resizingPoint[0] = x;

    if (isShiftPressed) {
      const centerY = (pointA[1] + pointB[1]) / 2;
      const directionY = pointA[1] <= pointB[1] ? 1 : -1;
      const height = Math.abs(pointB[0] - pointA[0]) / figure.ratio;

      pointA[1] = centerY - directionY * height / 2;
      pointB[1] = centerY + directionY * height / 2;
    }

    return;
  }
};

const resizeFigureBySide = (figure: Figure, activeFigureInfo: FigureInfo, { x, y, isShiftPressed }: { x: number; y: number; isShiftPressed: boolean }) => {
  if (['rectangle', 'diamond', 'oval'].includes(figure.type)) {
    resizeShapeBySide(figure, activeFigureInfo, { x, y, isShiftPressed });
    return;
  }

  if (['text'].includes(figure.type)) {
    resizeTextBySide(figure, activeFigureInfo, { x, y });
    return;
  }
}

export const resizeFigure = (figure: Figure, activeFigureInfo: FigureInfo, { x, y, isShiftPressed }: { x: number; y: number; isShiftPressed: boolean }) => {
  const {
    resizingDotName,
    resizingSideName,
    resizingSidePointName,
    resizingPointerOffset,
  } = activeFigureInfo;

  const coordinates = {
    x: x - resizingPointerOffset.offsetX,
    y: y - resizingPointerOffset.offsetY,
    isShiftPressed,
  };

  if (resizingDotName) {
    resizeFigureByDot(figure, activeFigureInfo, coordinates);
    return;
  }

  if (resizingSideName && resizingSidePointName) {
    resizeFigureBySide(figure, activeFigureInfo, coordinates);
    return;
  }
}

const getPointsCenter = (figure: Figure) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of figure.points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  if (figure.type === 'text') {
    maxX += figure.width * figure.scale
    maxY += figure.height * figure.scale
  }

  return [(minX + maxX) / 2, (minY + maxY) / 2];
};

export const moveToCoordinates = (figure: Figure, cursorX: number, cursorY: number) => {
  const [centerX, centerY] = getPointsCenter(figure);

  return figure.points.map(([pointX, pointY]: Point) => [pointX + cursorX - centerX, pointY + cursorY - centerY]);
};

export function calculateAspectRatio(figure: Figure) {
  const [x1, y1] = figure.points[0];
  const [x2, y2] = figure.points[1];

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return figure.ratio;
  }

  return Math.min(Math.max(Math.abs(dx / dy), 0.02), 50);
}
