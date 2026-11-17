import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { cropUploadedImage, parseCropArea } from "../lib/media/crop";
import { isImageCropAspect } from "../lib/media/crop-types";

async function splitImage() {
    const red = await sharp({ create: {
        width: 200, height: 200, channels: 3, background: "#ff0000",
    } }).png().toBuffer();
    return sharp({ create: {
        width: 400, height: 200, channels: 3, background: "#0000ff",
    } }).composite([{ input: red, left: 0, top: 0 }])
        .webp({ lossless: true }).toBuffer();
}

test("crop persegi mengikuti posisi pilihan dan menjaga berkas sumber", async () => {
    const input = await splitImage();
    const original = Buffer.from(input);
    assert.ok(isImageCropAspect("1/1"));
    for (const [x, channel] of [[0, 0], [200, 2]] as const) {
        const cropped = await cropUploadedImage(
            input, { x, y: 0, width: 200, height: 200 }, "1/1",
        );
        assert.equal(cropped.width, 200);
        assert.equal(cropped.height, 200);
        const pixel = await sharp(cropped.data)
            .extract({ left: 100, top: 100, width: 1, height: 1 })
            .removeAlpha().raw().toBuffer();
        assert.ok(pixel[channel] > 230);
        assert.ok(pixel[channel === 0 ? 2 : 0] < 25);
    }
    assert.deepEqual(input, original);
});

test("rasio berita 4:3 dan 16:10 tetap diproses sesuai bingkai", async () => {
    const input = await splitImage();
    for (const [aspect, width, height] of [
        ["4/3", 240, 180], ["16/10", 320, 200],
    ] as const) {
        const cropped = await cropUploadedImage(
            input, { x: 0, y: 0, width, height }, aspect,
        );
        assert.equal(cropped.width, width);
        assert.equal(cropped.height, height);
    }
});

test("crop menolak area di luar foto dan rasio yang berbeda", async () => {
    const input = await splitImage();
    for (const area of [
        { x: 300, y: 0, width: 200, height: 200 },
        { x: 0, y: 0, width: 400, height: 200 },
        { x: -1, y: 0, width: 200, height: 200 },
    ]) {
        await assert.rejects(
            cropUploadedImage(input, area, "1/1"),
            (error: unknown) => error instanceof Error &&
                "status" in error && error.status === 400,
        );
    }
});

test("koordinat dan preset crop tidak menerima nilai rusak", () => {
    for (const value of [null, [], {},
        { x: 0, y: 0, width: 0, height: 1 },
        { x: 0, y: 0, width: 1.5, height: 1 },
        { x: 0, y: Infinity, width: 1, height: 1 },
    ]) assert.equal(parseCropArea(value), null);
    for (const value of [null, "__proto__", "toString", "1:1", {}]) {
        assert.equal(isImageCropAspect(value), false);
    }
});
