"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

const mainVariant = {
  initial: { x: 0, y: 0 },
  animate: { x: 16, y: -16, opacity: 0.9 },
};

const secondaryVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

type FileUploadProps = {
  onChange?: (files: File[]) => void;
  label?: string;
  subtitle?: string;
};

export function FileUpload({ onChange, label = "Upload file", subtitle = "Arrasta ou clica para enviar" }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    onChange?.(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => console.error(error),
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="group/file relative block w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-[#0d0b12] p-8"
      >
        <input
          ref={fileInputRef}
          id="file-upload-input"
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-40">
          <GridPattern />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <p className="text-base font-semibold text-white">{label}</p>
          <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>
          <div className="relative mx-auto mt-10 w-full max-w-xl">
            {files.length > 0 &&
              files.map((file, idx) => (
                <motion.div
                  key={file.name + idx}
                  layoutId={idx === 0 ? "file-upload" : `file-upload-${idx}`}
                  className={cn(
                    "relative z-40 mt-4 flex w-full max-w-xl flex-col items-start justify-start overflow-hidden rounded-md border border-white/10 bg-white/5 p-4 backdrop-blur"
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-4">
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout className="max-w-xs truncate text-sm text-white">
                      {file.name}
                    </motion.p>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </motion.p>
                  </div>
                  <div className="mt-2 flex w-full flex-col items-start justify-between text-xs text-neutral-300 md:flex-row md:items-center">
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout className="rounded-md bg-white/5 px-1 py-0.5">
                      {file.type || "image/*"}
                    </motion.p>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout>
                      modificado {new Date(file.lastModified).toLocaleDateString()}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            {!files.length && (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "relative z-40 mt-4 flex h-32 w-full max-w-[8rem] items-center justify-center rounded-md bg-white/10 text-white shadow-[0px_10px_50px_rgba(0,0,0,0.2)] group-hover/file:shadow-2xl"
                )}
              >
                {isDragActive ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-sm text-white">
                    Larga aqui
                    <IconUpload className="h-4 w-4 text-white" />
                  </motion.p>
                ) : (
                  <IconUpload className="h-5 w-5 text-white" />
                )}
              </motion.div>
            )}
            {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className="absolute inset-0 z-30 h-32 w-full max-w-[8rem] rounded-md border border-dashed border-white/30"
              ></motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex flex-shrink-0 flex-wrap items-center justify-center gap-x-px gap-y-px bg-gradient-to-b from-white/5 to-black/10">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          const isAlt = index % 2 === 0;
          return (
            <div
              key={`${col}-${row}`}
              className={cn(
                "h-10 w-10 flex-shrink-0 rounded-[2px]",
                isAlt
                  ? "bg-white/5 shadow-[0_0_1px_2px_rgba(255,255,255,0.08)_inset]"
                  : "bg-black/20 shadow-[0_0_1px_2px_rgba(0,0,0,0.25)_inset]"
              )}
            />
          );
        })
      )}
    </div>
  );
}

