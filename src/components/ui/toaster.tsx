"use client";

import React from "react";
import { useToast } from "../../hooks/use-toast";

const Toaster: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-md shadow-md text-white ${
            toast.variant === "destructive" ? "bg-red-500" : "bg-green-500"
          }`}
        >
          <p className="font-medium">{toast.title}</p>
          {toast.description && <p className="text-sm">{toast.description}</p>}
        </div>
      ))}
    </div>
  );
};

export default Toaster;
