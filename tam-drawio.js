Draw.loadPlugin(function (ui) {
    const sidebar_id = 'TAM';
    const sidebar_title = 'TAM Notation';

    function drawArrow(c, x1, y1, x2, y2, isVertical, isLeftUp, startArrow, endArrow) {
        let cWidth = isLeftUp ? -10 : 10;
        let dx = 1;
        let dy = 1;
        let ArrowLength = 4;

        c.begin();
        if (isVertical) {
            let h = y2 - y1;
            if (startArrow) {
                c.moveTo(x1 + (isLeftUp ? dx : ArrowLength), y1 + (isLeftUp ? ArrowLength : dy));
                c.lineTo(x1, y1);
                c.lineTo(x1 - (isLeftUp ? ArrowLength : dy), y1 + (isLeftUp ? dx : ArrowLength));
            }

            c.moveTo(x1, y1);
            c.curveTo(x1 + cWidth, y1 + h / 3,
                x1 + cWidth, y1 + 2 * h / 3,
                x1, y2);
            if (endArrow) {
                c.moveTo(x1 + (isLeftUp ? dx : ArrowLength), y2 - (isLeftUp ? ArrowLength : dy));
                c.lineTo(x1, y2);
                c.lineTo(x1 - (isLeftUp ? ArrowLength : dy), y2 - (isLeftUp ? dx : ArrowLength));
            }
        } else {
            let w = x2 - x1;
            if (startArrow) {
                c.moveTo(x1 + (isLeftUp ? dy : ArrowLength), y1 - (isLeftUp ? ArrowLength : dx));
                c.lineTo(x1, y1);
                c.lineTo(x1 + (isLeftUp ? ArrowLength : dx), y1 + (isLeftUp ? dy : ArrowLength));
            }
            c.moveTo(x1, y1);
            c.curveTo(x1 + w / 3, y1 + cWidth,
                x1 + 2 * w / 3, y1 + cWidth,
                x2, y1);
            if (endArrow) {
                c.moveTo(x2 - (isLeftUp ? dx : ArrowLength), y1 - (isLeftUp ? ArrowLength : dx));
                c.lineTo(x2, y1);
                c.lineTo(x2 - (isLeftUp ? ArrowLength : dy), y1 + (isLeftUp ? dx : ArrowLength));
            }
        }
        c.stroke();
    }

    function drawRect(c, x, y, w, h) {
        c.begin();
        c.moveTo(x, y);
        c.lineTo(x + w, y);
        c.lineTo(x + w, y + h);
        c.lineTo(x, y + h);
        c.lineTo(x, y);
        c.close();
        c.end();
        c.fillAndStroke()
    }

    function createHandle(state, keys, getPositionFn, setPositionFn, ignoreGrid, redrawEdges, executeFn) {
        const handle = new mxHandle(state, null, mxVertexHandler.prototype.secondaryHandleImage);

        handle.execute = function (me) {
            for (let i = 0; i < keys.length; i++) {
                this.copyStyle(keys[i]);
            }

            if (executeFn) {
                executeFn(me);
            }
        };

        handle.getPosition = getPositionFn;
        handle.setPosition = setPositionFn;
        handle.ignoreGrid = (ignoreGrid != null) ? ignoreGrid : true;

        // Overridden to update connected edges
        if (redrawEdges) {
            const positionChanged = handle.positionChanged;
            handle.positionChanged = function () {
                positionChanged.apply(this, arguments);

                // Redraws connected edges TODO: Include child edges
                state.view.invalidate(this.state.cell);
                state.view.validate();
            };
        }

        return handle;
    }

    const tamConstants = {
        UP: 'up',
        DOWN: 'down',
        LEFT: 'left',
        RIGHT: 'right'
    };

    const rotatePosition = {
        [tamConstants.UP]: tamConstants.LEFT,
        [tamConstants.DOWN]: tamConstants.RIGHT,
        [tamConstants.LEFT]: tamConstants.UP,
        [tamConstants.RIGHT]: tamConstants.DOWN
    };

    const rotateDirection = {
        [mxConstants.DIRECTION_NORTH]: mxConstants.DIRECTION_EAST,
        [mxConstants.DIRECTION_SOUTH]: mxConstants.DIRECTION_WEST,
        [mxConstants.DIRECTION_EAST]: mxConstants.DIRECTION_NORTH,
        [mxConstants.DIRECTION_WEST]: mxConstants.DIRECTION_SOUTH,
        [mxConstants.NONE]: mxConstants.NONE,

    };

    const flipDirection = {
        [mxConstants.DIRECTION_NORTH]: mxConstants.DIRECTION_SOUTH,
        [mxConstants.DIRECTION_SOUTH]: mxConstants.DIRECTION_NORTH,
        [mxConstants.DIRECTION_EAST]: mxConstants.DIRECTION_WEST,
        [mxConstants.DIRECTION_WEST]: mxConstants.DIRECTION_EAST,
        [mxConstants.NONE]: mxConstants.NONE,
    }

    const tamUtils = {
        getStyleObject: styleString => styleString
            .split(';')
            .reduce(
                (acc, cur) => (
                    (([key, val]) => key && (acc[key] = val))(cur.split('=')),
                    acc
                ),
                {}
            ),
        getStyleString: styleObj => Object.keys(styleObj)
            .reduce((acc, cur) => acc + `${cur}=${styleObj[cur]};`, ''),
        registerCodec: codecClass => {
            const codec = new mxObjectCodec(new codecClass());
            codec.encode = enc => enc.document.createElement(codecClass.name);
            codec.decode = () => new codecClass();
            mxCodecRegistry.register(codec);
        }
    };

    class StorageCodec {
        create() {
            const cell = new mxCell(
                '',
                new mxGeometry(0, 0, 90, 40),
                tamUtils.getStyleString({
                    rounded: 1,
                    whiteSpace: 'wrap',
                    html: 1,
                    arcSize: 60
                })
            );
            cell.vertex = true;
            return cell;
        }
    }

    class VerticalUpdateEdgeCodec {
        create() {
            const cell = new mxCell(
                '',
                new mxGeometry(0, 0, 30, 80),
                tamUtils.getStyleString({
                    shape: 'updateedge',
                    endArrow: 'none',
                    vertical: true
                })
            );
            cell.geometry.relative = true;
            cell.edge = true;
            cell.geometry.setTerminalPoint(new mxPoint(15, 0), true);
            cell.geometry.setTerminalPoint(new mxPoint(15, 80), false);
            return cell;
        }
    }

    class HorizontalUpdateEdgeCodec {
        create() {
            const cell = new mxCell(
                '',
                new mxGeometry(0, 0, 80, 30),
                tamUtils.getStyleString({
                    shape: 'updateedge',
                    endArrow: 'none'
                })
            );
            cell.geometry.relative = true;
            cell.edge = true;
            cell.geometry.setTerminalPoint(new mxPoint(0, 15), true);
            cell.geometry.setTerminalPoint(new mxPoint(80, 15), false);
            return cell;
        }
    }

    class UpdateEdgeShape extends mxConnector {
        paintEdgeShape(c, pts, rounded) {
            c.setFillColor(this.stroke);
            c.setDashed(c.state.dashed, c.state.fixDash);
            c.setShadow(false);

            if (pts.length < 2) {
                return;
            }
            const isVertical = mxUtils.getValue(this.style, 'vertical', false);
            if (isVertical) {
                drawArrow(c, pts[0].x + 5, pts[0].y + 5, pts[1].x + 5, pts[1].y - 5, isVertical, false, true, false);
                drawArrow(c, pts[0].x - 5, pts[0].y + 5, pts[1].x - 5, pts[1].y - 5, isVertical, true, false, true);
            } else {
                drawArrow(c, pts[0].x + 5, pts[0].y - 5, pts[1].x - 5, pts[1].y - 5, isVertical, true, true, false);
                drawArrow(c, pts[0].x + 5, pts[0].y + 5, pts[1].x - 5, pts[1].y + 5, isVertical, false, false, true);
            }

            (sourceMarker => typeof sourceMarker === 'function' && sourceMarker())(this.createMarker(c, pts, true));
            (targetMarker => typeof targetMarker === 'function' && targetMarker())(this.createMarker(c, pts, false));
        }
        getLabelMargins(rect) {
            return new mxRectangle(0, 2.5 * Math.min(rect.height / 2,
                Math.round(rect.height / 8) + this.strokewidth - 1), 0, 0);
        }
    }

    class UseEdgeShape extends mxConnector {
        paintEdgeShape(c, pts, rounded) {
            c.setDashed(c.state.dashed, c.state.fixDash);
            c.setShadow(false);

            if (pts.length < 2) { return; }
            const isVertical = mxUtils.getValue(this.style, 'vertical', false);

            const prev = c.pointerEventsValue;
            c.pointerEventsValue = 'stroke';

            const drawEdge = (drawPoints) => {
                this.style && this.style[mxConstants.STYLE_CURVED] === '1' ?
                    this.paintCurvedLine(c, drawPoints) :
                    this.paintLine(c, drawPoints, this.isRounded);
            }

            const inBetween = (n, n1, n2) => {
                return (n >= n1 && n <= n2 || n >= n2 && n <= n1);
            }

            const circleRadius = 8;
            let x = 0, y = 0;
            let p0 = 0, p1 = 1;
            let vertLine = isVertical;

            let cx = mxUtils.getNumber(this.state.style, 'dx', -1);
            let cy = mxUtils.getNumber(this.state.style, 'dy', -1);
            let rectMsg = ""
            if (cx === -1 || cy === -1) {
                //uninitialized
                vertLine = (pts.length === 2) ? isVertical : !isVertical;

                if (pts.length > 2) {
                    p0 = Math.floor(pts.length / 2) - 1;
                    p1 = p0 + 1;
                }

                x = vertLine ? pts[p0].x : pts[p0].x + (pts[p1].x - pts[p0].x) / 2;
                y = vertLine ? pts[p0].y + (pts[p1].y - pts[p0].y) / 2 : pts[p0].y;
            } else {
                //calculate on-the-line point
                p0 = 0;
                p1 = 1;
                let left = Math.min(pts[0].x, pts[pts.length - 1].x);
                let top = Math.min(pts[0].y, pts[pts.length - 1].y);
                rectMsg = "[" + left + "," + top + "]"
                for (let i = 0; i < pts.length - 1; i++) {

                    if (pts[i].x === pts[i + 1].x || isVertical && pts.length === 2) {
                        if (inBetween(top + cy, pts[i].y, pts[i + 1].y)) {
                            y = top + cy;
                            x = pts[i].x;
                            p0 = i;
                            p1 = i + 1;
                            vertLine = true;

                            if (Math.abs(pts[i].x - (left + cx)) <= 2 * circleRadius) {
                                //found best match
                                break;
                            }
                        }
                    } else {
                        if (inBetween(left + cx, pts[i].x, pts[i + 1].x)) {
                            y = pts[i].y;
                            x = left + cx;
                            p0 = i;
                            p1 = i + 1;
                            vertLine = false;

                            if (Math.abs(pts[i].y - (top + cy)) <= 2 * circleRadius) {
                                //found best match
                                break;
                            }
                        }
                    }
                }
            }

            const lineDirectionCoefficient = vertLine ?
                (pts[p0].y > pts[p1].y ? 1 : -1) :
                (pts[p0].x < pts[p1].x ? 1 : -1);
            let cpt = vertLine ?
                new mxPoint(x, y + lineDirectionCoefficient * circleRadius) :
                new mxPoint(x - lineDirectionCoefficient * circleRadius, y);
            //ui.editor.setStatus(rectMsg + "--" + JSON.stringify(pts) + "--" + cpt.x + "," + cpt.y)
            let pts1 = [...pts.slice(0, p0 + 1), cpt]
            drawEdge(pts1);

            const strokeWidth = c.getCurrentStrokeWidth();
            c.setStrokeWidth(strokeWidth * 2);
            c.ellipse(
                x - circleRadius,
                y - circleRadius,
                circleRadius * 2,
                circleRadius * 2
            );
            c.stroke();
            c.setStrokeWidth(strokeWidth);
            cpt = vertLine ?
                new mxPoint(x, y - lineDirectionCoefficient * circleRadius) :
                new mxPoint(x + lineDirectionCoefficient * circleRadius, y)
            let endPoint =
                (pts.length === 2) ?
                    (vertLine ? new mxPoint(pts[0].x, pts[1].y) : new mxPoint(pts[1].x, pts[0].y)) :
                    pts[pts.length - 1];

            pts1 = [cpt, ...pts.slice(p1, pts.length - 1), endPoint];
            drawEdge(pts1);

            c.pointerEventsValue = prev;

            // Draw triangle
            let useSignPosition = mxUtils.getValue(this.style, 'useSignPosition', 'up');
            let useSignDirection = mxUtils.getValue(this.style, 'useSignDirection', 'none');

            // Preserve logical direction of triangle, when curve is flipped
            if (useSignDirection !== 'none' && lineDirectionCoefficient === -1) {
                useSignDirection = flipDirection[useSignDirection];
            }

            // Adjust the location to the position of the circle
            if (pts.length > 2 && p0 % 2 === 0) {
                useSignPosition = rotatePosition[useSignPosition];
                useSignDirection = rotateDirection[useSignDirection];
            }

            let dx, dy;
            let tpts, rpt

            switch (useSignPosition) {
                case 'down':
                    dy = 25;
                    dx = 0;
                    break;
                case 'left':
                    dy = 0;
                    dx = -25;

                    break;
                case 'right':
                    dy = 0;
                    dx = -25;
                    break;
                case 'up':
                default:
                    dy = -25;
                    dx = 0;
            }
            switch (useSignDirection) {
                case 'none':
                    tpts = [];
                    rpt = [-5, -5];
                    break;
                case 'north':
                    dy += -5;
                    tpts = [[-5, 0], [0, -10], [5, 0], [0, -2]];
                    rpt = [-5, 5]
                    break;
                case 'south':
                    dy += 5;
                    tpts = [[-5, 0], [0, 10], [5, 0], [0, 2]];
                    rpt = [-5, -15]
                    break;
                case 'west':
                    dx += -5;
                    tpts = [[0, -5], [-10, 0], [0, 5], [-2, 0]];
                    rpt = [5, -5]
                    break;
                case 'east':
                default:
                    dx += 5;
                    tpts = [[0, -5], [10, 0], [0, 5], [2, 0]];
                    rpt = [-15, -5]
            }
            c.translate(x + dx, y + dy);
            if (useSignDirection !== 'none') {
                c.begin()

                c.moveTo(tpts[0][0], tpts[0][1]);
                for (let i = 1; i < tpts.length; i++) {
                    c.lineTo(tpts[i][0], tpts[i][1]);
                }
                c.lineTo(tpts[0][0], tpts[0][1]);

                c.close();
                c.end();
                c.setFillColor(this.stroke)
                c.fillAndStroke();

                //Output the R
                c.setFontColor(this.stroke)
                c.text(rpt[0], rpt[1], 10, 10, "R");
            }

            // Disables shadows, dashed styles and fixes fill color for markers
            c.setFillColor(this.stroke);
            c.setShadow(false);
            c.setDashed(false);

            (sourceMarker => typeof sourceMarker === 'function' && sourceMarker())(this.createMarker(c, pts, true));
            (targetMarker => typeof targetMarker === 'function' && targetMarker())(this.createMarker(c, pts, false));
        }
    }

    class Dot3Shape extends mxCylinder {
        paintVertexShape(c, x, y, w, h) {
            const isVertical = mxUtils.getValue(this.style, 'vertical', false);
            const radius = isVertical ? 2 * w / 3 : 2 * h / 3;
            const x1 = x + radius * .25;
            const y1 = y + radius * .25;
            const dx = isVertical ? 0 : radius * 1.8;
            const dy = isVertical ? radius * 1.8 : 0;

            c.setFillColor(this.stroke);
            for (let i = 0; i < 3; i++) {
                c.ellipse(x1 + i * dx, y1 + i * dy, radius, radius);
                c.fillAndStroke();
            }
        }
    }

    class AgentShape extends mxRectangleShape {
        paintVertexShape(c, x, y, w, h) {
            const multiple = mxUtils.getValue(this.style, 'multiple', false);
            const offsetSize = mxUtils.getValue(this.style, 'offsetSize', 8);
            if (multiple) {
                drawRect(c, x + offsetSize, y - offsetSize, w, h);
            }
            drawRect(c, x, y, w, h);
        }
    }

    class ActorShape extends mxRectangleShape {
        paintVertexShape(c, x, y, w, h) {
            //we maintain aspect ratio
            w = 2 * h / 3
            drawRect(c, x, y, w, h);
            let margin = mxUtils.getValue(this.style, 'margin', h / 10);
            x += margin / 2;
            y += margin / 2;
            w -= margin;
            h -= margin;

            c.translate(x, y);

            // Head
            c.ellipse(w / 4, 0, w / 2, h / 4);
            c.fillAndStroke();

            c.begin();
            c.moveTo(w / 2, h / 4);
            c.lineTo(w / 2, 2 * h / 3);

            // Arms
            c.moveTo(w / 2, h / 3 + 3);
            c.lineTo(0, h / 3);
            c.moveTo(w / 2, h / 3 + 3);
            c.lineTo(w, h / 3);

            // Legs
            c.moveTo(w / 2, 2 * h / 3);
            c.lineTo(0, h);
            c.moveTo(w / 2, 2 * h / 3);
            c.lineTo(w, h);
            c.end();

            c.stroke();
        }
    }

    class LShape extends mxRectangleShape {
        paintVertexShape(c, x, y, w, h) {
            const margin = mxUtils.getValue(this.style, 'margin', h / 10);
            const dx = mxUtils.getValue(this.style, 'dx', 80);
            const dy = mxUtils.getValue(this.style, 'dy', 20);

            c.begin();
            c.moveTo(x, y);
            c.lineTo(x + w, y);
            c.lineTo(x + w, y + dy);
            c.lineTo(x + dx, y + dy);
            c.lineTo(x + dx, y + h);
            c.lineTo(x, y + h);
            c.lineTo(x, y);
            c.close();
            c.end();
            c.fillAndStroke();
        }
    }

    class UShape extends mxRectangleShape {
        paintVertexShape(c, x, y, w, h) {
            const margin = mxUtils.getValue(this.style, 'margin', h / 10);
            const dx = mxUtils.getValue(this.style, 'dx', 20);
            const dy = mxUtils.getValue(this.style, 'dy', 80);

            c.begin();
            c.moveTo(x, y);
            c.lineTo(x + dx, y);
            c.lineTo(x + dx, y + dy);
            c.lineTo(x + w - dx, y + dy);
            c.lineTo(x + w - dx, y);
            c.lineTo(x + w, y);
            c.lineTo(x + w, y + h);
            c.lineTo(x, y + h);
            c.lineTo(x, y);
            c.close();
            c.end();
            c.fillAndStroke();
        }
    }

    // Register codecs
    tamUtils.registerCodec(StorageCodec);
    tamUtils.registerCodec(VerticalUpdateEdgeCodec);
    tamUtils.registerCodec(HorizontalUpdateEdgeCodec);

    // Register custom shapes
    mxCellRenderer.registerShape('updateedge', UpdateEdgeShape);
    mxCellRenderer.registerShape('useedge', UseEdgeShape);
    mxCellRenderer.registerShape('dot3', Dot3Shape);
    mxCellRenderer.registerShape('agent', AgentShape);
    mxCellRenderer.registerShape('actor', ActorShape);
    mxCellRenderer.registerShape('lshape', LShape);
    mxCellRenderer.registerShape('ushape', UShape);

    // Adds custom sidebar entry
    ui.sidebar.addPalette(sidebar_id, sidebar_title, true, function (content) {
        content.appendChild(ui.sidebar.createEdgeTemplate('shape=useedge;vertical=true;endArrow=none;useSignPosition=left;useSignDirection=south;dx=0;dy=80;', 0, 160, ''));
        content.appendChild(ui.sidebar.createEdgeTemplate('shape=useedge;endArrow=none;useSignPosition=up;useSignDirection=east;dx=80;dy=0;', 160, 0, ''));
        content.appendChild(ui.sidebar.createEdgeTemplate('shape=useedge;vertical=true;edgeStyle=elbowEdgeStyle;elbow=vertical;endArrow=none;useSignPosition=up;useSignDirection=east;dx=35;dy=80;', 70, 160, ''));
        content.appendChild(ui.sidebar.createEdgeTemplate('shape=useedge;edgeStyle=elbowEdgeStyle;elbow=horizontal;endArrow=none;useSignPosition=left;useSignDirection=south;dx=80;dy=35;', 160, 70, ''));
        content.appendChild(ui.sidebar.createVertexTemplate('rounded=1;whiteSpace=wrap;html=1;arcSize=60;strokeWidth=2;', 90, 40, ''));
        content.appendChild(ui.sidebar.createVertexTemplate('shape=dot3;vertical=true;connectable=0;', 15, 55, ''));
        content.appendChild(ui.sidebar.createVertexTemplate('shape=dot3;connectable=0;', 55, 15, ''));
        content.appendChild(ui.sidebar.createEdgeTemplateFromCells([VerticalUpdateEdgeCodec.prototype.create()], 160, 0, 'Vertical Access'));
        content.appendChild(ui.sidebar.createEdgeTemplateFromCells([HorizontalUpdateEdgeCodec.prototype.create()], 160, 0, 'Horizontal Access'));
        content.appendChild(ui.sidebar.createVertexTemplate('shape=agent;offsetSize=8;strokeWidth=2;', 100, 60, ''));
        content.appendChild(ui.sidebar.createVertexTemplate('shape=agent;offsetSize=8;strokeWidth=2;multiple=true;', 100, 60, ''));
        content.appendChild(ui.sidebar.createVertexTemplate('shape=actor;horizontalLabelPosition=right;align=left;labelPosition=right;strokeWidth=2;', 25, 50, ''));
        content.appendChild(ui.sidebar.createVertexTemplate('shape=lshape;dx=20;dy=20;strokeWidth=2;labelPosition=center;verticalLabelPosition=middle;align=center;verticalAlign=top;', 100, 100, ''));
        content.appendChild(ui.sidebar.createVertexTemplate('shape=ushape;dx=20;dy=80;strokeWidth=2;labelPosition=center;verticalLabelPosition=middle;align=center;verticalAlign=bottom;', 100, 100, ''));
    });

    mxResources.parse('flipUse=Flip Use Direction');

    // Adds action
    ui.actions.addAction('flipUse', function () {

        if (!ui.editor.graph.isSelectionEmpty() && !ui.editor.graph.isEditing()) {

            const cells = ui.editor.graph.getSelectionCells();
            let style = tamUtils.getStyleObject(cells[0].style);
            let isVertical = style.edgeStyle == 'elbowEdgeStyle' ? style.vertical : !style.vertical;
            if (style.shape !== 'useedge') {
                return;
            }

            // south => north => none => south => ...
            // east => west => none => east => ...
            switch (style.useSignDirection) {
                case 'north':
                    style.useSignDirection = 'none'
                    break;
                case 'south':
                    style.useSignDirection = 'north'
                    break;
                case 'west':
                    style.useSignDirection = 'none'
                    break;
                case 'east':
                    style.useSignDirection = 'west'
                    break;
                case 'none':
                    style.useSignDirection = isVertical ? 'east' : 'south';
                    break;
            }

            cells[0].setStyle(mxUtils.setStyle(cells[0].style, 'useSignDirection', style.useSignDirection));
            ui.editor.graph.refresh(cells[0]);
        }
    });

    ui.toolbar.addSeparator();
    const elt = ui.toolbar.addItem('', 'flipUse');
    elt.firstChild.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' version=\'1.1\' width=\'82px\' height=\'82px\' viewBox=\'-0.5 -0.5 82 2\'%3E%3Cg%3E%3Cpath d=\'M 0 10 L 22 10\' fill=\'none\' stroke=\'%23000000\' stroke-miterlimit=\'10\' pointer-events=\'stroke\' stroke-width=\'4\'/%3E%3Cellipse cx=\'40\' cy=\'10\' rx=\'18\' ry=\'18\' fill=\'none\' stroke=\'%23000000\' pointer-events=\'stroke\' stroke-width=\'8\'/%3E%3Cpath d=\'M 58 10 L 80 10\' fill=\'none\' stroke=\'%23000000\' stroke-miterlimit=\'10\' pointer-events=\'stroke\' stroke-width=\'4\'/%3E%3Cpath d=\'M 45 -30 L 55 -25 L 45 -20 L 47 -25 L 45 -30 Z\' fill=\'%23000000\' stroke=\'%23000000\' stroke-miterlimit=\'10\' pointer-events=\'all\'/%3E%3Cg fill=\'%23000000\' font-family=\'Arial,Helvetica\' font-size=\'22px\' font-weight=\'800\'%3E%3Ctext x=\'24.5\' y=\'-19.5\'%3ER%3C/text%3E%3C/g%3E%3C/g%3E%3C/svg%3E")';
    elt.firstChild.style.backgroundPosition = 'center';
    elt.firstChild.style.backgroundSize = 'contain';
    elt.firstChild.style.backgroundRepeat = 'no-repeat';

    if (typeof mxVertexHandler !== 'undefined' && Graph.handleFactory && typeof Graph.handleFactory === "object") {
        const singleDxDyPoint = (state) => {
            return [
                createHandle(state, ['dx', 'dy'], function (bounds) {
                    var dx = Math.max(0, Math.min(bounds.width, mxUtils.getValue(this.state.style, 'dx', 80)));
                    var dy = Math.max(0, Math.min(bounds.height, mxUtils.getValue(this.state.style, 'dy', 20)));

                    return new mxPoint(bounds.x + dx, bounds.y + dy);
                }, function (bounds, pt) {
                    this.state.style['dx'] = Math.round(Math.max(0, Math.min(bounds.width, pt.x - bounds.x)));
                    this.state.style['dy'] = Math.round(Math.max(0, Math.min(bounds.height, pt.y - bounds.y)));
                }, false)
            ]
        };

        Graph.handleFactory['lshape'] = singleDxDyPoint;
        Graph.handleFactory['ushape'] = singleDxDyPoint;
        Graph.handleFactory['useedge'] = singleDxDyPoint;
    }
});
