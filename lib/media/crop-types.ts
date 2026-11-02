export const IMAGE_CROP_PRESETS = {
    "4/3": {
        width: 1600,
        height: 1200,
    },
    "16/10": {
        width: 1600,
        height: 1000,
    },
} as const;

export type ImageCropAspect =
    keyof typeof IMAGE_CROP_PRESETS;

export type CropAreaPixels = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export function isImageCropAspect(
    value: unknown,
): value is ImageCropAspect {
    return (
        typeof value === "string" &&
        Object.hasOwn(IMAGE_CROP_PRESETS, value)
    );
}
