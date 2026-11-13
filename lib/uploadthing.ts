import type { OurFileRouter } from "@/app/api/uploadthing/core";

import {
    generateUploadButton,
    generateUploadDropzone,
} from "@uploadthing/react";
import { genUploader } from "uploadthing/client";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

/** Sube archivos desde código, sin el recuadro de arrastrar. */
export const { uploadFiles } = genUploader<OurFileRouter>();
