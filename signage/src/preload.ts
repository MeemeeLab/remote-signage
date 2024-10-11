// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, webFrame } from "electron";

contextBridge.exposeInMainWorld("electron", {
    ipcRenderer: {
        on: (event: string, callback: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => {
            ipcRenderer.on(event, callback);
        },
        send: (event: string, ...args: unknown[]): Promise<void> => {
            return ipcRenderer.invoke(event, ...args);
        }
    }
});

webFrame.setVisualZoomLevelLimits(1, 1); // Disable zooming
