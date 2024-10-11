/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';

const WIDTH = 192;
const HEIGHT = 96;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = WIDTH;
canvas.height = HEIGHT;

const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;
ctx.font = "bold 64px serif";
// ctx.filter = "url(#remove-alpha)";

function fill(color: string) {
    ctx.fillStyle = color;
    ctx.rect(0, 0, WIDTH, HEIGHT);
    ctx.fill();
}

function calculateTextFont(text: string): {
    font: string,
    x: number,
    y: number
} {
    let px = 0;
    let prevMeasurement = null;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        px++;
        ctx.font = `bold ${px}px Noto Sans`;

        const measurement = ctx.measureText(text);

        const width = measurement.width;
        const height = measurement.actualBoundingBoxAscent
            + measurement.actualBoundingBoxDescent;
        if (
            width > (WIDTH - 4) || height > (HEIGHT - 4)
        ) {
            const width = prevMeasurement.width;
            const height = prevMeasurement.actualBoundingBoxAscent
                + prevMeasurement.actualBoundingBoxDescent;
            return {
                font: `bold ${px - 1}px Noto Sans`,
                x: Math.round((WIDTH - width) / 2),
                // eslint-disable-next-line no-control-regex
                y: Math.round((HEIGHT - (/[^\x00-\x7F]/.test(text) ? 0 : 16) - height) / 2),
            };
        }

        prevMeasurement = measurement;
    }
}

function text(font: string, color: string, text: string, x: number, y: number) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "start";
    ctx.textBaseline = "top";
    ctx.fillText(text, x, y);
}

fill("black");

const w = window as typeof window & {
    electron: {
        ipcRenderer: {
            on: (event: string, callback: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => void;
            send: (event: string, ...args: unknown[]) => Promise<void>;
        }
    }
};

w.electron.ipcRenderer.on("text", (_, t_) => {
    const t = t_ as string;

    const calc = t ? calculateTextFont(t) : { font: "", x: 0, y: 0 };

    for (let i = 0; i < 4; i++) {
        if (i % 2 == 0) {
            setTimeout(() => {
                fill("red");
                text(calc.font, "black", t, calc.x, calc.y);
            }, i * 1000);
        } else {
            setTimeout(() => {
                fill("black");
                text(calc.font, "white", t, calc.x, calc.y);
            }, i * 1000);
        }
    }
});
