/* eslint-disable no-bitwise */
import { encode } from "blurhash";
import { FastAverageColor } from "fast-average-color";
import ImageKit from "imagekit";
import { nanoid } from "nanoid";
import sharp from "sharp";

import { env } from "src/env/server.mjs";

export const imageKit = new ImageKit({
    privateKey: env.IMAGEKIT_PRIVATE_KEY,
    publicKey: env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
});

const fac = new FastAverageColor();

/** Get the uri of a base64 image */
export const getImageUriFromBase64 = (imageBase64: string) => {
    const uri = imageBase64.split(";base64,").pop();

    if (!uri) {
        throw new Error("Failed to convert imageBase64 to uri");
    }
    return uri;
};

/** Upload image to imageKit after converting it to an avif file */
export const uploadImage = async (imageBase64: string, imageFolder: string) => {
    const uri = getImageUriFromBase64(imageBase64);

    const avifImageBuffer = await sharp(Buffer.from(uri, "base64"))
        .toFormat("avif", { quality: 100 })
        .avif()
        .toBuffer();

    return imageKit.upload({
        file: avifImageBuffer,
        fileName: nanoid(24),
        folder: `/${env.IMAGEKIT_BASE_FOLDER}/${imageFolder}/`,
    });
};

/** Generate a blur hash value to the uploading image */
export const encodeImageToBlurhash = async (imageBase64: string) => {
    const uri = getImageUriFromBase64(imageBase64);

    const { data, info } = await sharp(Buffer.from(uri, "base64"))
        .raw()
        .ensureAlpha()
        .resize(32, 32, { fit: "inside" })
        .toBuffer({ resolveWithObject: true });

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
};

/** Extract the average color of the image */
export const getColor = async (imageBase64: string) => {
    const uri = getImageUriFromBase64(imageBase64);

    const { data } = await sharp(Buffer.from(uri, "base64"))
        .raw()
        .ensureAlpha()
        .resize(32, 32, { fit: "inside" })
        .toBuffer({ resolveWithObject: true });

    return fac.getColorFromArray4(data);
};

/** Enhance image quality: auto-rotate (EXIF), normalize exposure, boost saturation, sharpen */
export const enhanceImage = async (imageBase64: string): Promise<string> => {
    const uri = getImageUriFromBase64(imageBase64);

    const enhancedBuffer = await sharp(Buffer.from(uri, "base64"))
        .rotate()                                        // Auto-rotate based on EXIF orientation
        .normalise()                                     // Auto-levels: stretch histogram for better exposure/contrast
        .modulate({ brightness: 1.02, saturation: 1.2 }) // Slight brightness + color saturation boost
        .sharpen({ sigma: 0.6 })                         // Subtle sharpening for crispness
        .jpeg({ quality: 92 })
        .toBuffer();

    return `data:image/jpeg;base64,${enhancedBuffer.toString("base64")}`;
};

/** Generate hex color value from rgb values */
export const rgba2hex = (rgb1: number, rgb2: number, rgb3: number) => {
    const hex =
        (rgb1 | (1 << 8)).toString(16).slice(1) +
        (rgb2 | (1 << 8)).toString(16).slice(1) +
        (rgb3 | (1 << 8)).toString(16).slice(1);

    return `#${hex}`;
};
