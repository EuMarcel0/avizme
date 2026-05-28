"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type OpenModalOptions = {
  title?: ReactNode;
  description?: ReactNode;
  content: ReactNode;
  /** Classes extras no painel do modal (ex.: max-w-5xl) */
  className?: string;
  /** Impede fechar clicando fora ou no X */
  preventClose?: boolean;
};

type ModalContextValue = {
  isOpen: boolean;
  options: OpenModalOptions | null;
  openModal: (options: OpenModalOptions) => void;
  closeModal: () => void;
  updateModal: (patch: Partial<OpenModalOptions>) => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<OpenModalOptions | null>(null);

  const openModal = useCallback((next: OpenModalOptions) => {
    setOptions(next);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setOptions(null), 200);
  }, []);

  const updateModal = useCallback((patch: Partial<OpenModalOptions>) => {
    setOptions((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      options,
      openModal,
      closeModal,
      updateModal,
    }),
    [isOpen, options, openModal, closeModal, updateModal],
  );

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModal deve ser usado dentro de ModalProvider");
  }
  return ctx;
}
