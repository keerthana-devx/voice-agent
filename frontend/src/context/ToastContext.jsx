import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, ...toast }]);
    if (toast.duration !== 0) {
      const dur = toast.duration || 5000;
      setTimeout(() => removeToast(id), dur);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const success = useCallback((message, opts = {}) => addToast({ type: "success", message, ...opts }), [addToast]);
  const error = useCallback((message, opts = {}) => addToast({ type: "error", message, ...opts }), [addToast]);
  const info = useCallback((message, opts = {}) => addToast({ type: "info", message, ...opts }), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  return useContext(ToastContext);
};

const toastVariants = {
  hidden: { opacity: 0, x: 20 },
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 w-full max-w-xs">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial="hidden"
            animate="enter"
            exit="exit"
            variants={toastVariants}
            transition={{ duration: 0.18 }}
            className={`glass px-4 py-3 rounded-lg shadow-md border ${t.type === "success" ? "border-green-400/20" : t.type === "error" ? "border-red-400/20" : "border-white/10"}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {t.type === "success" ? (
                  <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : t.type === "error" ? (
                  <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none"><path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <svg className="w-5 h-5 text-[--ai-primary]" viewBox="0 0 24 24" fill="none"><path d="M13 16h-1v-4h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm text-[--ai-text] font-medium">{t.title || (t.type === "success" ? "Success" : t.type === "error" ? "Error" : "Info")}</div>
                <div className="text-sm text-[--ai-muted]">{t.message}</div>
              </div>
              <button onClick={() => onClose(t.id)} className="text-[--ai-muted] ml-2">✕</button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
