// [ui/screenshot.js] 截图与录屏
// 职责：截取 Canvas 画面、录制视频、导出文件
// 不负责：模拟引擎状态的读写

import { createElement } from "./dom.js";

export function screenshot(emu, callback, source, format, upscale) {
    const imageFormat = format || emu.getSettingValue("screenshotFormat") || emu.capture.photo.format;
    const imageUpscale = upscale || parseInt(emu.getSettingValue("screenshotUpscale") || emu.capture.photo.upscale);
    const screenshotSource = source || emu.getSettingValue("screenshotSource") || emu.capture.photo.source;
    const videoRotation = parseInt(emu.getSettingValue("videoRotation") || 0);
    const aspectRatio = emu.gameManager.getVideoDimensions("aspect") || 1.333333;
    const gameWidth = emu.gameManager.getVideoDimensions("width") || 256;
    const gameHeight = emu.gameManager.getVideoDimensions("height") || 224;
    const videoTurned = (videoRotation === 1 || videoRotation === 3);
    let width = emu.canvas.width;
    let height = emu.canvas.height;
    let scaleHeight = imageUpscale;
    let scaleWidth = imageUpscale;
    let scale = 1;

    if (screenshotSource === "retroarch") {
        if (width >= height) {
            width = height * aspectRatio;
        } else if (width < height) {
            height = width / aspectRatio;
        }
        emu.gameManager.screenshot().then(screenshot => {
            const blob = new Blob([screenshot], { type: "image/png" });
            if (imageUpscale === 0) {
                callback(blob, "png");
            } else if (imageUpscale > 1) {
                scale = imageUpscale;
                const img = new Image();
                const screenshotUrl = URL.createObjectURL(blob);
                img.src = screenshotUrl;
                img.onload = () => {
                    const canvas = createElement("canvas");
                    canvas.width = width * scale;
                    canvas.height = height * scale;
                    const ctx = canvas.getContext("2d", { alpha: false });
                    ctx.imageSmoothingEnabled = false;
                    ctx.scale(scaleWidth, scaleHeight);
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        callback(blob, imageFormat);
                        img.remove();
                        URL.revokeObjectURL(screenshotUrl);
                        canvas.remove();
                    }, "image/" + imageFormat, 1);
                };
            }
        });
    } else if (screenshotSource === "canvas") {
        if (width >= height && !videoTurned) {
            width = height * aspectRatio;
        } else if (width < height && !videoTurned) {
            height = width / aspectRatio;
        } else if (width >= height && videoTurned) {
            width = height * (1/aspectRatio);
        } else if (width < height && videoTurned) {
            width = height / (1/aspectRatio);
        }
        if (imageUpscale === 0) {
            scale = gameHeight / height;
            scaleHeight = scale;
            scaleWidth = scale;
        } else if (imageUpscale > 1) {
            scale = imageUpscale;
        }
        const captureCanvas = createElement("canvas");
        captureCanvas.width = width * scale;
        captureCanvas.height = height * scale;
        captureCanvas.style.display = "none";
        const captureCtx = captureCanvas.getContext("2d", { alpha: false });
        captureCtx.imageSmoothingEnabled = false;
        captureCtx.scale(scale, scale);
        const imageAspect = emu.canvas.width / emu.canvas.height;
        const canvasAspect = width / height;
        let offsetX = 0;
        let offsetY = 0;

        if (imageAspect > canvasAspect) {
            offsetX = (emu.canvas.width - width) / -2;
        } else if (imageAspect < canvasAspect) {
            offsetY = (emu.canvas.height - height) / -2;
        }
        const drawNextFrame = () => {
            captureCtx.drawImage(emu.canvas, offsetX, offsetY, emu.canvas.width, emu.canvas.height);
            captureCanvas.toBlob((blob) => {
                callback(blob, imageFormat);
                captureCanvas.remove();
            }, "image/" + imageFormat, 1);
        };
        requestAnimationFrame(drawNextFrame);
    }
}

export function takeScreenshot(emu, source, format, upscale) {
    return new Promise<any>((resolve) => {
        screenshot(emu, async (blob, returnFormat) => {
            const arrayBuffer = await blob.arrayBuffer();
            const uint8 = new Uint8Array(arrayBuffer);
            resolve({ screenshot: uint8, format: returnFormat });
        }, source, format, upscale);
    });
}
