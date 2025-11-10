"use client";

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import type { ScatterDataPoint } from "./chart-3d";

/**
 * Props for ArticleDrawer component
 */
export interface ArticleDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedPoint: ScatterDataPoint | null;
}

/**
 * Drawer component to display article details
 *
 * @param props - Component props
 * @param props.open - Whether the drawer is open
 * @param props.onClose - Callback to close the drawer
 * @param props.selectedPoint - The selected data point to display
 * @returns JSX element
 */
export function ArticleDrawer({
  open,
  onClose,
  selectedPoint,
}: ArticleDrawerProps): React.JSX.Element {
  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{selectedPoint?.articleTitle ?? "Untitled"}</DrawerTitle>
          <DrawerDescription>
            <a
              href={selectedPoint?.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {selectedPoint?.articleUrl}
            </a>
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            {selectedPoint?.content}
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
