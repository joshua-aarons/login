import { Vector } from "../../SvgPlus/vector.js";
import { hsl2rgb } from "../utils.js";
import { Line, LineStyles, Renderable, Axis, Text, Grid, Group, Rect, TextStyles, Tick, ClipPath, Defs } from "./plot.js";

const sinCurve = (t) => Math.sin(Math.PI * t / 2);

const COLORSCALES ={
    red2green: (value) => hsl2rgb(120 * value, 100, 15 + 35 * sinCurve(Math.min(value*5, 1)) - 5 * sinCurve(Math.max(value*5-4, 0))),
    red2greenNormal: (value) => hsl2rgb(120 * value, 100, 50),
}
const {PI} = Math;

class ColorScaleImage extends Renderable {
    scaleFunction = COLORSCALES.red2green;
    static scaleFunction_parser(value) { 
        if (typeof value === "string") {
            if (value in COLORSCALES) {
                return COLORSCALES[value];
            } else {
                throw new Error(`ColorScale: Invalid scale function name: ${value}`);
            }
        } else if (value instanceof Function) {
            let test = value(0);
            if (Array.isArray(test) && test.length === 3 && test.every(v => typeof v === "number" && v >= 0 && v <= 255)) {
                return value;
            } else {
                throw new Error(`ColorScale: Invalid scale function output: ${test}`);
            }
        } else {
            throw new Error(`ColorScale: Invalid scale function value: ${value}`);
        }
    }

    portrait = false;

    position = new Vector(0, 0);
    static position_parser(value) { return new Vector(value); }

    width = 256;
    
    height = 20;
    borderRadius = 0;

    imageAttribute = "href"

    outlineStyles = LineStyles.make();

    validate() {
        const {width, height, portrait} = this;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        let range=  portrait ? height : width
        for (let i = 0; i < range; i++) {
            const [r, g, b] = this.scaleFunction(i / (range - 1));
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(
                ...(portrait ? [0, i, width, 1] : [i, 0, 1, height])
            );
        }
        this.dataURL = canvas.toDataURL();
        this.rect = Rect.make({
            position: this.position,
            width: this.width,
            height: this.height,
            styles: this.outlineStyles,
            borderRadius: this.borderRadius
        });
        this.clipPath = ClipPath.make({
            children: [Rect.make({
                position: this.position,
                width: this.width,
                height: this.height,
                borderRadius: this.borderRadius
            })]
        })
        this.defs = Defs.make({ children: [this.clipPath] }) 
    }

    render() {
        const {width, height, position: {x, y}, dataURL, rect} = this;
        let r = this.outlineStyles.strokeWidth > 0 ? `${rect}` : "";
        let img = `<g>${r} ${this.defs}  <image clip-path="${this.clipPath.link}" ${this.imageAttribute}="${dataURL}" width="${width}" height="${height}" x="${x}" y="${y}" /> </g>`;
        return img;
    }
}

class ColorScaleLegend extends Renderable {

    colorScale = ColorScaleImage.make();
    static colorScale_parser(value) { return ColorScaleImage.make(value); }

    minValue = 0;
    maxValue = 1;
    tickIncrements = 10;

    tickLength = 0;

    flipTickSide = false;

    tickLineStyles = LineStyles.make();
    static tickLineStyles_parser(value) { return LineStyles.make(value); }

    tickTextStyles = TextStyles.make();
    static tickTextStyles_parser(value) { return TextStyles.make(value); }


    tickFormatFunction = (value) => value.toFixed(2);
    static tickFormatFunction_parser(value) {
        if (typeof value === "string") {
            return (v) => value.replace("${value}", v.toFixed(1));
        } else if (value instanceof Function) {
            return value;
        } else {
            throw new Error(`ColorScaleLegend: Invalid tick format function: ${value}`);
        }
    }


    get pos() {
        return this._realPos || this.position;
    }

    validate() {
        const {width, height, portrait, pos} = this.colorScale;
        let bbox = this.colorScale.boundingBox;
        const {flipTickSide, minValue, maxValue, tickIncrements, tickLength, tickLineStyles, tickTextStyles} = this;
        let ticks = []
        for (let i = 0; i <= tickIncrements; i++) {
            const value = minValue + (maxValue - minValue) * i / tickIncrements;
            
            const tickX = portrait ? 
                 pos.x + (flipTickSide ? width : 0) : 
                 pos.x + (width) * i / tickIncrements;
            const tickY = portrait ?
                pos.y + (height) * i / tickIncrements : 
                pos.y + (flipTickSide ? height : 0);

            const tick = Tick.make({
                position: new Vector(tickX, tickY),
                tickDirection: portrait ? (flipTickSide ? 0 : PI) : (flipTickSide ?  3*PI/2 : PI/2),
                tickLength: tickLength,
                tickSpace: portrait ? this.tickTextStyles.fontSize * 0.25 : 0,
                lineStyles: tickLineStyles,
                content: this.tickFormatFunction(value),
                textStyles: tickTextStyles
            });
            
            bbox = bbox.union(tick.boundingBox);
            ticks.push(tick)
    
        }

        this._realPos = bbox.pos;
        this.width = bbox.size.x;
        this.height = bbox.size.y;
        this.ticks = ticks;
    }

    render() {
        return `<g>${this.colorScale}${this.ticks.join("")}</g>`;
    }
}

class HeatmapGrid extends Renderable {
    width = 100;
    height = 100;

    position = new Vector(0, 0);
    static position_parser(value) { return new Vector(value); }

    spacing = 0;
    borderRadius = 0;
    boundingBorderRadius = 10;

    borderStyles = LineStyles.make();
    static borderStyles_parser(value) { return LineStyles.make(value); }

    data = [[]];
    static data_parser(value) {
        if (Array.isArray(value) && value.every(row => Array.isArray(row))) {
            return value;
        } else {
            throw new Error(`Heatmap: Invalid data value: ${value}`);
        }
    }

    colorScale = COLORSCALES.red2green;
    static colorScale_parser(value) { 
        if (typeof value === "string") {
            if (value in COLORSCALES) {
                return COLORSCALES[value];
            } else {
                throw new Error(`Heatmap: Invalid color scale function name: ${value}`);
            }
        } else if (value instanceof Function) {
            let test = value(0);
            if (Array.isArray(test) && test.length === 3 && test.every(v => typeof v === "number" && v >= 0 && v <= 255)) {
                return value;
            } else {
                throw new Error(`Heatmap: Invalid color scale function output: ${test}`);
            }
        } else {
            throw new Error(`Heatmap: Invalid color scale function value: ${value}`);
        }
    }   
    
    validate() {
        const {spacing, width, height, position: {x, y}, data, colorScale} = this;
        let rects = []

        let clipPath = null;
        if (this.boundingBorderRadius > 0) {
            let boundingRect = Rect.make({
                position: this.position.add(spacing/2),
                width: this.width - spacing,
                height: this.height - spacing,
                styles: this.borderStyles,
                borderRadius: this.boundingBorderRadius,
            })
            clipPath = ClipPath.make({
                children: [boundingRect],
            })
            let defs = Defs.make({children: [clipPath]});
            rects.push(defs);
        }


        const rows = data.length;
        const cols = data[0].length;
        const ch = height / rows;
        const cw = width/ cols;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const value = data[i][j];
                if (typeof value === "number") {
                    const [r, g, b] = colorScale(value);
                    let styles = {
                        fill: `rgb(${r}, ${g}, ${b})`,
                        stroke: "none",
                    }
                    if (i === 0 || j === 0 || i === rows - 1 || j === cols - 1) {
                        styles.clipPath = clipPath;
                    }
                    rects.push(Rect.make({
                        position: new Vector(
                            x + spacing/2 + j * (cw),
                            y + spacing/2 + i * (ch)
                        ),
                        width: cw - spacing,
                        height: ch - spacing,
                        borderRadius: this.borderRadius,
                        styles
                    }))
                }
            }
        }

        
     

        this.rects = rects;
        
    }

    render() {
        return `<g>${this.rects.join("")}</g>`;
    }

}

class HeatmapPlot extends Renderable {
    data = [[]];
    static data_parser(value) {
        if (Array.isArray(value) && value.every(row => Array.isArray(row))) {
            return value;
        } else {
            throw new Error(`HeatmapPlot: Invalid data value: ${value}`);
        }
    }

    colorScale = COLORSCALES.red2green;
    static colorScale_parser(value) { 
        if (typeof value === "string") {
            if (value in COLORSCALES) {
                return COLORSCALES[value];
            } else {
                throw new Error(`HeatmapPlot: Invalid color scale function name: ${value}`);
            }
        } else if (value instanceof Function) {
            let test = value(0);
            if (Array.isArray(test) && test.length === 3 && test.every(v => typeof v === "number" && v >= 0 && v <= 255)) {
                return value;
            } else {
                throw new Error(`HeatmapPlot: Invalid color scale function output: ${test}`);
            }
        } else {
            throw new Error(`HeatmapPlot: Invalid color scale function value: ${value}`);
        }
    }

    title = "Heatmap Title";

    spacing = 4;

    borderRadius = 5;

    scaleWidth = 10;


    width = 400;
    height = 400;

    showGrid = true;

    position = new Vector(0, 0)
    static position_parser(value) { return new Vector(value); }

    tickLineStyles = LineStyles.make();
    static tickLineStyles_parser(value) { return LineStyles.make(value); }

    gridLineStyles = LineStyles.make();
    static gridLineStyles_parser(value) { return LineStyles.make(value); }

    tickTextStyles = TextStyles.make({
        fill: "#595a5c",
    });
    static tickTextStyles_parser(value) { return TextStyles.make(value); }

    labelTextStyles = TextStyles.make();
    static labelTextStyles_parser(value) { return TextStyles.make(value); }

    titleTextStyles = TextStyles.make();
    static titleTextStyles_parser(value) { return TextStyles.make(value); }

    tickXFormatFunction = (value) => value.toFixed(2);
    static tickXFormatFunction_parser(value) {
        if (typeof value === "string") {
            return (v) => value.replace("${value}", v.toFixed(1));
        } else if (value instanceof Function) {
            return value;
        } else {
            throw new Error(`HeatmapPlot: Invalid tick format function: ${value}`);
        }
    }

    tickYFormatFunction = null;
    static tickYFormatFunction_parser(value) {
        if (value === null) return null;
        if (typeof value === "string") {
            return (v) => value.replace("${value}", v.toFixed(1));
        } else if (value instanceof Function) {
            return value;
        } else {
            throw new Error(`HeatmapPlot: Invalid tick format function: ${value}`);
        }
    }   

    tickZFormatFunction = null;
    static tickZFormatFunction_parser(value) {
        if (value === null) return null;
        if (typeof value === "string") {
            return (v) => value.replace("${value}", v.toFixed(1));
        } else if (value instanceof Function) {
            return value;
        } else {
            throw new Error(`HeatmapPlot: Invalid tick format function: ${value}`);
        }
    }

    tickLength = 10;
    
    yAxisLabel = "Y Axis";
    xAxisLabel = "X Axis";
    zAxisLabel = "Z Axis";

    zMinValue = 0;
    zMaxValue = 1;
    zTickIncrements = 10;

    portrait = true;

    get size() {
        return this._renderable.size;
    }

    get pos() {
        return this._renderable.pos;
    }


    validate() {
        const {textStyles, axisLabelFontSize} = this;
        const rows = this.data.length;
        const cols = this.data[0].length;

        const heatmap = HeatmapGrid.make({
            position: this.position,
            width: this.width,
            height: this.height,
            data: this.data,
            colorScale: this.colorScale,
            spacing: this.spacing,
            borderRadius: this.borderRadius,
            borderStyles: this.gridLineStyles
        });

        let gridLineStyles = this.showGrid ? this.gridLineStyles : LineStyles.make({stroke: "transparent"});

        let nXTicks = Math.floor(this.data[0].length/2);
        let xTicks = new Array(nXTicks).fill(0).map((_, i) => i/(nXTicks-1));
        xTicks.shift();

        let nYTicks = Math.floor(this.data.length/2);
        let yTicks = new Array(nYTicks).fill(0).map((_, i) => i/(nYTicks-1));
        yTicks.shift();

        const axisX = Axis.make({
            position: this.position,
            axisLength: this.width,
            tickLength: this.tickLength,
            portrait: false,

            ticks: xTicks,
            tickLineStyles: this.tickLineStyles,
            tickTextStyles: this.tickTextStyles,
            axisLineStyles: gridLineStyles,
            tickFormatFunction: this.tickXFormatFunction
        })

        const axisY = Axis.make({
            position: this.position,
            axisLength: this.height,
            tickLength: this.tickLength,
            portrait: true,
            ticks: yTicks,
            tickLineStyles: this.tickLineStyles,
            tickTextStyles: this.tickTextStyles,
            axisLineStyles: gridLineStyles,
            tickFormatFunction: this.tickYFormatFunction || this.tickXFormatFunction
        })

        const zeroValue = Text.make({
            position: this.position,
            anchor: "right-bottom",
            content: this.tickXFormatFunction(0),
            styles: this.tickTextStyles
        })
        let children = [heatmap, axisX, axisY, zeroValue];

        if (this.yAxisLabel) {
            const yAxisLabel = Text.make({
                content: this.yAxisLabel,
                position: [
                    axisY.pos.x - this.tickLength,
                    axisY.pos.y + axisY.size.y / 2
                ],
                anchor: "center-bottom",
                rotation: -90,
                styles: this.labelTextStyles
            });
            children.push(yAxisLabel);
        }

        if (this.xAxisLabel) {
            const xAxisLabel = Text.make({
                content: this.xAxisLabel,
                position: [
                    axisX.pos.x + axisX.size.x / 2,
                    axisX.pos.y - this.tickLength
                ],
                anchor: "center-bottom",
                styles: this.labelTextStyles
            });
            children.push(xAxisLabel);
        }


        if (this.showGrid) {
            const grid = Grid.make({
                xPositions: new Array(cols+1).fill(0).map((_, i) => this.width * i / (cols)),
                yPositions: new Array(rows+1).fill(0).map((_, i) => this.height * i / (rows)),
                position: this.position,
                width: this.width,
                height: this.height,
                styles: this.gridLineStyles,
            });
              rects.push(Rect.make({
                position: this.position,
                width: this.width,
                height: this.height,
                styles: this.gridLineStyles,
            }))
            children.push(grid);
        }

        let main = Group.make({
            children
        });

        children = [main]

        const colorScaleLegend = ColorScaleLegend.make({
            colorScale: {
                width: this.portrait ? this.width : this.scaleWidth,
                height: this.portrait ? this.scaleWidth : this.height,
                scaleFunction: (t) => this.colorScale(1-t),
                position: this.portrait ? [
                    heatmap.pos.x,
                    main.pos.y + main.size.y + 10
                ] : [
                    main.pos.x + main.size.x + 10,
                    heatmap.pos.y 
                ],
                portrait: !this.portrait,
                borderRadius: 5,
                outlineStyles: {strokeWidth: 0}
            },
            flipTickSide: true,
            minValue: this.portrait ? this.zMinValue : this.zMaxValue,
            maxValue: this.portrait ? this.zMaxValue : this.zMinValue,
            tickIncrements: this.zTickIncrements,
            tickTextStyles: this.tickTextStyles,
            tickLineStyles: this.tickLineStyles,
            tickFormatFunction: this.tickZFormatFunction || this.tickXFormatFunction
        })

        if (this.zAxisLabel) {
            let width = this.portrait ? colorScaleLegend.size.y + this.tickLength : colorScaleLegend.size.x + this.tickLength;
            width = this.zTickIncrements == 1 ? this.scaleWidth + this.tickLength : width;
            const zAxisLabel = Text.make({
                content: this.zAxisLabel,
                position: this.portrait ? [
                    colorScaleLegend.pos.x + colorScaleLegend.size.x / 2,
                    colorScaleLegend.pos.y + width
                ] : [
                    colorScaleLegend.pos.x + width,
                    colorScaleLegend.pos.y +  colorScaleLegend.size.y / 2
                ],
                anchor: this.portrait ? "center-top" : "center-bottom",
                rotation: this.portrait ? 0 : 90,
                styles: this.labelTextStyles
            });
            children.push(zAxisLabel);
        }

        if (this.title) {
            const title = Text.make({
                content: this.title,
                position: [
                    this.position.x + this.width / 2,
                    main.pos.y - this.tickLength
                ],
                anchor: "center-bottom",
                styles: this.titleTextStyles
            })
            children.push(title);
        }

         children.push(colorScaleLegend);

        this._renderable = Group.make({
            children
        });



    }

    render() {
        return this._renderable.render();   
    }

}




export {
    HeatmapPlot,
    ColorScaleLegend,
    ColorScaleImage,
    HeatmapGrid,
    COLORSCALES
}