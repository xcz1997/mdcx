/**
 * 确认对话框组件
 */

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  type DialogProps,
  DialogTitle,
} from "@mui/material";
import { type ReactNode, useCallback, useState } from "react";

export interface ConfirmDialogProps extends Omit<DialogProps, "open" | "onClose"> {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: ReactNode;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "inherit" | "primary" | "secondary" | "success" | "error" | "info" | "warning";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "确认操作",
  message = "确定要执行此操作吗？",
  confirmText = "确定",
  cancelText = "取消",
  confirmColor = "primary",
  loading = false,
  ...props
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [onConfirm, onClose]);

  const isConfirmLoading = loading || isLoading;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth {...props}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {typeof message === "string" ? <DialogContentText>{message}</DialogContentText> : message}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isConfirmLoading}>
          {cancelText}
        </Button>
        <Button onClick={handleConfirm} color={confirmColor} variant="contained" disabled={isConfirmLoading}>
          {isConfirmLoading ? "处理中..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;
