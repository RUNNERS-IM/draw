import React, { useEffect, useState, useCallback, useRef } from "react";
import "./ToolBar.scss";
import { drawingToolList, shapeList, widthList, shortcutHintHoldDelayMs, toolbarViewportMargin, updateStoreDelay } from "../constants";

import { t } from '../../../../shared/i18n';
import { toolbarIconSize, isToolbarReversed, getVisibleToolbarPosition } from '../../../../shared/toolbarPosition';

const STICKY_DISTANCE = 15;

const humanizedKey = (key) => {
  const keyMap = {
    Meta: "⌘",
    Control: "⌃",
    Alt: "⌥",
    Shift: "⇧",
  };

  return keyMap[key] || key;
};

const humanizedShortcut = (shortcut) => {
  if (!shortcut) return null
  if (shortcut === '[NULL]') return null

  return shortcut.split("+").map(humanizedKey).join("");
};

const ToolBar = ({
  orientation,
  position,
  setPosition,
  toolbarSlide,
  setToolbarSlide,
  isCollapsed,
  setIsCollapsed,
  shortcutHintsDisabled,
  clearDeskShortcut,
  lastActiveBrush,
  lastActiveFigure,
  activeTool,
  activeColorIndex,
  activeWidthIndex,
  handleCloseToolBar,
  handleChangeColor,
  handleChangeWidth,
  handleChangeTool,
  handleClearDesk,
  handleUndo,
  handleEnablePointerMode,
  handlePositionCommit,
  Icons,
  colorList,
}) => {
  const toolConfig = {
    brush:       { title: t("tool.brush"),       alias: "B", mainPanel: "1", subPanel: "1" },
    pen:         { title: t("tool.pen"),         alias: "P", mainPanel: "1", subPanel: "2" },
    fadepen:     { title: t("tool.fadepen"),     alias: "P", mainPanel: "1", subPanel: "3" },
    highlighter: { title: t("tool.highlighter"), alias: "H", mainPanel: "2" },
    arrow:       { title: t("tool.arrow"),       alias: "A", mainPanel: "3", subPanel: "1" },
    flat_arrow:  { title: t("tool.flat_arrow"),  alias: "A", mainPanel: "3", subPanel: "2" },
    rectangle:   { title: t("tool.rectangle"),   alias: "R", mainPanel: "4", subPanel: "3" },
    diamond:     { title: t("tool.diamond"),     alias: "D", mainPanel: "4", subPanel: "4" },
    oval:        { title: t("tool.oval"),        alias: "O", mainPanel: "5", subPanel: "5" },
    line:        { title: t("tool.line"),                    mainPanel: "4", subPanel: "6" },
    text:        { title: t("tool.text"),        alias: "T", mainPanel: "6" },
    laser:       { title: t("tool.laser"),       alias: "L", mainPanel: "7" },
    eraser:      { title: t("tool.eraser"),      alias: "E", mainPanel: "7" },
    color:       { title: t("tool.color"),                   mainPanel: "8", disabledFor: ["laser", "eraser"] },
    brushSize:   { title: t("tool.brushSize"),               mainPanel: "8" },
    undo:        { title: t("tool.undo"),                    mainPanel: "⌘Z" },
    clearDesk:   { title: t("tool.clear"),                   mainPanel: humanizedShortcut(clearDeskShortcut) },
  };

  const toolbarTools = [
    ["pen", <Icons.Pen />],
    ["highlighter", <Icons.Highlighter />],
    ["arrow", <Icons.Arrow />],
    ["rectangle", <Icons.Rectangle />],
    ["oval", <Icons.Oval />],
    ["text", <Icons.Text />],
    ["eraser", <Icons.Eraser />],
  ];

  const allIcons = {
    brush: <Icons.Brush />,
    pen: <Icons.Pen />,
    fadepen: <Icons.MagicPen />,
    arrow: <Icons.Arrow />,
    flat_arrow: <Icons.FlatArrow />,
    rectangle: <Icons.Rectangle />,
    diamond: <Icons.Diamond />,
    oval: <Icons.Oval />,
    line: <Icons.Line />,
    text: <Icons.Text />,
    highlighter: <Icons.Highlighter />,
    laser: <Icons.Laser />,
    eraser: <Icons.Eraser />,
  };

  const activeColor = colorList[activeColorIndex];

  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showShortcutHints, setShowShortcutHints] = useState(false);
  const [shortcutHintRevealCount, setShortcutHintRevealCount] = useState(0);

  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const [toolbarSize, setToolbarSize] = useState(toolbarIconSize);
  const isReversed = isToolbarReversed(position, viewport, orientation);
  const visiblePosition = getVisibleToolbarPosition(
    position, viewport, toolbarSize, orientation, isReversed, toolbarViewportMargin
  );

  const toolbarRef = useRef();
  const shortcutHintTimerRef = useRef(null);
  const positionCommitTimeoutRef = useRef(null);

  const clearShortcutHintTimer = useCallback(() => {
    if (!shortcutHintTimerRef.current) return;

    clearTimeout(shortcutHintTimerRef.current);
    shortcutHintTimerRef.current = null;
  }, []);

  const hideShortcutHints = useCallback(() => {
    clearShortcutHintTimer();
    setShowShortcutHints(false);
  }, [clearShortcutHintTimer]);

  const handleShortcutHintKeyDown = useCallback((event) => {
    const eventRepeat = event.repeat;

    if (event.key !== "Meta" && event.key !== "Control") {
      hideShortcutHints();
      return;
    }

    if (eventRepeat) return;

    const hasOtherModifier = event.altKey || event.shiftKey || (event.ctrlKey && event.metaKey);

    if (hasOtherModifier || shortcutHintsDisabled || isCollapsed) {
      hideShortcutHints();
      return;
    }

    clearShortcutHintTimer();
    shortcutHintTimerRef.current = setTimeout(() => {
      shortcutHintTimerRef.current = null;
      setShortcutHintRevealCount((count) => count + 1);
      setShowShortcutHints(true);
    }, shortcutHintHoldDelayMs);
  }, [clearShortcutHintTimer, hideShortcutHints, isCollapsed, shortcutHintsDisabled]);

  const handleShortcutHintKeyUp = useCallback((event) => {
    if (event.metaKey) return;
    if (event.ctrlKey) return;

    hideShortcutHints();
  }, [hideShortcutHints]);

  const clampPosition = useCallback((x, y, withSticky = false) => {
    const toInt = (value) => Math.trunc(value);

    if (!toolbarRef.current) {
      return { x: toInt(x), y: toInt(y) };
    }

    const toolbarWidth = toolbarIconSize.width;
    const toolbarHeight = toolbarIconSize.height;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const minX = toolbarViewportMargin;
    const minY = toolbarViewportMargin;
    const maxX = Math.max(toolbarViewportMargin, windowWidth - toolbarViewportMargin - toolbarWidth);
    const maxY = Math.max(toolbarViewportMargin, windowHeight - toolbarViewportMargin - toolbarHeight);

    if (!withSticky) {
      return {
        x: toInt(Math.min(Math.max(x, minX), maxX)),
        y: toInt(Math.min(Math.max(y, minY), maxY)),
      };
    }

    const leftEdge = STICKY_DISTANCE + toolbarViewportMargin;
    const topEdge = STICKY_DISTANCE + toolbarViewportMargin;
    const rightEdge = windowWidth - toolbarViewportMargin - STICKY_DISTANCE;
    const bottomEdge = windowHeight - toolbarViewportMargin - STICKY_DISTANCE;

    let nextX = x;
    let nextY = y;

    if (nextX < leftEdge) {
      nextX = minX;
    } else if (nextX + toolbarWidth > rightEdge) {
      nextX = maxX;
    }

    if (nextY < topEdge) {
      nextY = minY;
    } else if (nextY + toolbarHeight > bottomEdge) {
      nextY = maxY;
    }

    return { x: toInt(nextX), y: toInt(nextY) };
  }, []);

  const onPointerDown = (e) => {
    setDragging(true);
    setOffset({
      x: e.clientX - visiblePosition.x,
      y: e.clientY - visiblePosition.y,
    });
  };

  const onPointerMove = useCallback((e) => {
    if (!dragging) return;

    const newX = e.clientX - offset.x;
    const newY = e.clientY - offset.y;

    setPosition(clampPosition(newX, newY, true));
  }, [dragging, offset, clampPosition, setPosition]);

  const onPointerUp = useCallback(() => {
    if (!dragging) return;

    clearTimeout(positionCommitTimeoutRef.current);

    handlePositionCommit(position);
    setDragging(false);
  }, [dragging, position, handlePositionCommit]);

  useEffect(() => {
    setPosition((prev) => clampPosition(prev.x, prev.y));
  }, [position.x, position.y, clampPosition, setPosition]);

  useEffect(() => {
    clearTimeout(positionCommitTimeoutRef.current);

    if (dragging) return;

    positionCommitTimeoutRef.current = setTimeout(() => {
      handlePositionCommit(position);
    }, updateStoreDelay);

    return () => {
      clearTimeout(positionCommitTimeoutRef.current);
    };
  }, [position.x, position.y, dragging, handlePositionCommit]);

  useEffect(() => {
    const toolbarElement = toolbarRef.current;
    if (!toolbarElement) {
      return;
    }

    let frameId = null;

    const applyClamp = () => {
      // Refit the visible toolbar without changing the saved icon position.
      const width = toolbarElement.offsetWidth;
      const height = toolbarElement.offsetHeight;
      setToolbarSize((prev) => {
        if (prev.width === width && prev.height === height) return prev;
        return { width, height };
      });
    };

    const scheduleClamp = () => {
      if (frameId) {
        return;
      }

      frameId = requestAnimationFrame(() => {
        frameId = null;
        applyClamp();
      });
    };

    const resizeObserver = new ResizeObserver(scheduleClamp);
    resizeObserver.observe(toolbarElement);

    scheduleClamp();
    // window.addEventListener("resize", scheduleClamp);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      resizeObserver.disconnect();
      // window.removeEventListener("resize", scheduleClamp);
    };
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  useEffect(() => {
    window.addEventListener("keydown", handleShortcutHintKeyDown);
    window.addEventListener("keyup", handleShortcutHintKeyUp);
    window.addEventListener("blur", hideShortcutHints);
    document.addEventListener("visibilitychange", hideShortcutHints);

    return () => {
      window.removeEventListener("keydown", handleShortcutHintKeyDown);
      window.removeEventListener("keyup", handleShortcutHintKeyUp);
      window.removeEventListener("blur", hideShortcutHints);
      document.removeEventListener("visibilitychange", hideShortcutHints);
      clearShortcutHintTimer();
    };
  }, [clearShortcutHintTimer, handleShortcutHintKeyDown, handleShortcutHintKeyUp, hideShortcutHints]);

  useEffect(() => {
    if (!shortcutHintsDisabled && !isCollapsed) return;

    hideShortcutHints();
  }, [hideShortcutHints, isCollapsed, shortcutHintsDisabled]);

  const pickTool = (tool) => {
    handleChangeTool(tool);
    setToolbarSlide("main-slide")
  };

  const onChangeColor = (index) => {
    handleChangeColor(index);
    setToolbarSlide("main-slide")
  };

  const onChangeWidth = (index) => {
    handleChangeWidth(index);
    setToolbarSlide("main-slide")
  };

  const renderShortcutTitle = (title, ...shortcuts) => {
    const titleShortcuts = shortcuts.filter(Boolean);

    return titleShortcuts.length ? `${title} — ${titleShortcuts.join(" or ")}` : title;
  };

  const renderToolTitle = (tool, shortcutType) => {
    const config = toolConfig[tool];

    return renderShortcutTitle(config.title, config.alias, config[shortcutType]);
  };

  const pickFigureOrSwitchView = () => {
    if (shapeList.includes(activeTool)) {
      setToolbarSlide("tool-slide");
    } else {
      pickTool(lastActiveFigure);
    }
  };

  const pickBrushOrSwitchView = () => {
    if (drawingToolList.includes(activeTool)) {
      setToolbarSlide("brush-slide");
    } else {
      pickTool(lastActiveBrush);
    }
  };

  const handleToggleCollapsed = () => {
    setIsCollapsed((prev) => !prev);
  };

  const renderToolShortcutHint = (tool, shortcutType) => {
    const config = toolConfig[tool];
    const shortcut = config[shortcutType];

    if (!config.alias) return shortcut;
    if (shortcutHintRevealCount % 2 === 0) return config.alias;

    return shortcut;
  };

  const isColorControlDisabled = toolConfig.color.disabledFor.includes(activeTool);
  const areShortcutHintsVisible = showShortcutHints && !shortcutHintsDisabled && !isCollapsed;

  return (
    <aside
      id="toolbar"
      ref={toolbarRef}
      className={`
        toolbar--${orientation}
        ${isReversed ? "toolbar--reversed" : ""}
        ${toolbarSlide}
        ${isCollapsed ? "toolbar--collapsed" : ""}
        ${areShortcutHintsVisible ? "toolbar--shortcut-hints-visible" : ""}
      `}
      style={{ left: visiblePosition.x, top: visiblePosition.y }}
    >
      <div className="toolbar__mode-switcher">
        <div className="toolbar__draglines" onPointerDown={onPointerDown}>
          <div className="draglines">
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
          </div>
        </div>

        <div className="toolbar__main-button">
          <button tabIndex={-1} title={t("toolbar.pointerMode")} onClick={handleEnablePointerMode}>
            <Icons.DrawModeEnabled />
          </button>
        </div>

        <div className="toolbar__draglines" onPointerDown={onPointerDown}>
          <div className="draglines">
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
          </div>
        </div>
      </div>

      <div className="toolbar__container">
        <div className="toolbar__panels-track">
          <div className="toolbar__panel toolbar__panel--full">
            <div className="toolbar__body">
              <ul className="toolbar__items">
                {toolbarTools.map(([tool, icon]) => (
                  <li key={tool} className={activeTool === tool ? "active" : undefined} onClick={() => pickTool(tool)}>
                    <button tabIndex={-1} title={renderToolTitle(tool, "mainPanel")}>
                      {icon}
                    </button>
                    <div className="toolbar__shortcut-hint">{renderToolShortcutHint(tool, "mainPanel")}</div>
                  </li>
                ))}
                <li className="cross-line"></li>
                <li onClick={() => !isColorControlDisabled && setToolbarSlide("color-slide")}>
                  <button tabIndex={-1} className={`toolbar__color-picker ${activeColor.isRainbow ? 'color-rainbow' : ''} color_tool_${activeTool}`} style={{ backgroundColor: activeColor.color }} title={isColorControlDisabled ? renderToolTitle("color") : renderToolTitle("color", "mainPanel")} />
                  {!isColorControlDisabled && <div className="toolbar__shortcut-hint">{renderToolShortcutHint("color", "mainPanel")}</div>}
                </li>
                <li className="cross-line"></li>
                <li onClick={handleUndo}>
                  <button tabIndex={-1} title={renderToolTitle("undo", "mainPanel")}>
                    <Icons.Undo />
                  </button>
                  <div className="toolbar__shortcut-hint">{renderToolShortcutHint("undo", "mainPanel")}</div>
                </li>
                <li onClick={handleClearDesk}>
                  <button tabIndex={-1} title={renderToolTitle("clearDesk", "mainPanel")}>
                    <Icons.Trash />
                  </button>
                  {toolConfig.clearDesk.mainPanel && (
                    <div className="toolbar__shortcut-hint">{renderToolShortcutHint("clearDesk", "mainPanel")}</div>
                  )}
                </li>
              </ul>
            </div>

          <div className="side-view-body brush-group">
            <ul className="toolbar__items">
              <li className={activeTool === "brush" ? "active" : undefined} onClick={() => pickTool("brush")}>
                <button tabIndex={-1} title={renderToolTitle("brush", "subPanel")}>
                  <Icons.Brush />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("brush", "subPanel")}</div>
              </li>
              <li className={activeTool === "pen" ? "active" : undefined} onClick={() => pickTool("pen")}>
                <button tabIndex={-1} title={renderToolTitle("pen", "subPanel")}>
                  <Icons.Pen />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("pen", "subPanel")}</div>
              </li>
              <li className={activeTool === "fadepen" ? "active" : undefined} onClick={() => pickTool("fadepen")}>
                <button tabIndex={-1} title={renderToolTitle("fadepen", "subPanel")}>
                  <Icons.MagicPen />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("fadepen", "subPanel")}</div>
              </li>
            </ul>
          </div>

          <div className="side-view-body tool-group">
            <ul className="toolbar__items">
              <li className={activeTool === "arrow" ? "active" : undefined} onClick={() => pickTool("arrow")}>
                <button tabIndex={-1} title={renderToolTitle("arrow", "subPanel")}>
                  <Icons.Arrow />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("arrow", "subPanel")}</div>
              </li>
              <li className={activeTool === "flat_arrow" ? "active" : undefined} onClick={() => pickTool("flat_arrow")}>
                <button tabIndex={-1} title={renderToolTitle("flat_arrow", "subPanel")}>
                  <Icons.FlatArrow />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("flat_arrow", "subPanel")}</div>
              </li>
              <li className={activeTool === "rectangle" ? "active" : undefined} onClick={() => pickTool("rectangle")}>
                <button tabIndex={-1} title={renderToolTitle("rectangle", "subPanel")}>
                  <Icons.Rectangle />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("rectangle", "subPanel")}</div>
              </li>
              <li className={activeTool === "diamond" ? "active" : undefined} onClick={() => pickTool("diamond")}>
                <button tabIndex={-1} title={renderToolTitle("diamond", "subPanel")}>
                  <Icons.Diamond />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("diamond", "subPanel")}</div>
              </li>
              <li className={activeTool === "oval" ? "active" : undefined} onClick={() => pickTool("oval")}>
                <button tabIndex={-1} title={renderToolTitle("oval", "subPanel")}>
                  <Icons.Oval />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("oval", "subPanel")}</div>
              </li>
              <li className={activeTool === "line" ? "active" : undefined} onClick={() => pickTool("line")}>
                <button tabIndex={-1} title={renderToolTitle("line", "subPanel")}>
                  <Icons.Line />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("line", "subPanel")}</div>
              </li>
            </ul>
          </div>

          <div className="side-view-body color-group">
            <ul className="toolbar__items">
              {
                colorList.map((color, index) => {
                  const shortcut = String(index + 1);

                  return (
                    <li
                      key={index}
                      className={activeColorIndex === index ? "active" : undefined}
                      onClick={() => onChangeColor(index)}
                    >
                      <button tabIndex={-1} className={`toolbar__color-picker ${color.isRainbow ? 'color-rainbow' : ''}`} style={{ backgroundColor: color.color }} title={renderShortcutTitle(color.title, shortcut)} />
                      <div className="toolbar__shortcut-hint">{shortcut}</div>
                    </li>
                  );
                })
              }
            </ul>
          </div>

          <div className="side-view-body width-group">
            <ul className="toolbar__items">
              {
                widthList.map((width, index) => {
                  const shortcut = String(index + 1);

                  return (
                    <li
                      key={index}
                      className={activeWidthIndex === index ? "active" : undefined}
                      onClick={() => onChangeWidth(index)}
                    >
                      <button tabIndex={-1} className={`toolbar__width-picker ${width.name}`} title={renderShortcutTitle(width.title, shortcut)}>
                        <div />
                      </button>
                      <div className="toolbar__shortcut-hint">{shortcut}</div>
                    </li>
                  );
                })
              }
            </ul>
          </div>
          </div>

          <div className="toolbar__panel toolbar__panel--mini">
            <div className="toolbar__body">
              <ul className="toolbar__items">
                <li className="active" onClick={handleToggleCollapsed}>
                  <button tabIndex={-1} title={renderToolTitle(activeTool, "mainPanel")}>
                    {allIcons[activeTool]}
                  </button>
                </li>

                <div className="toolbar__color-hint-wrapper" onClick={handleToggleCollapsed}>
                  <div className={`toolbar__color-hint color_tool_${activeTool} ${activeColor.isRainbow ? 'color-rainbow' : ''} ${widthList[activeWidthIndex].name}`} style={{ backgroundColor: activeColor.color }}></div>
                </div>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="toolbar__slider" onClick={handleToggleCollapsed}>
        {
          isCollapsed !== isReversed ? <Icons.AngleRight /> : <Icons.AngleLeft />
        }
      </div>

      <div className="toolbar__close">
        <button tabIndex={-1} title={t("toolbar.hide")} onClick={handleCloseToolBar}>
          <Icons.Close size={16} />
        </button>
      </div>
    </aside>
  );
};

export default ToolBar;
