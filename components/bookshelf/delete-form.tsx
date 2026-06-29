"use client";

import React from "react";

interface DeleteFormProps {
  action: (formData: FormData) => void;
  confirmMessage: string;
  idName: string;
  idValue: string;
  buttonText: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
}

export default function DeleteForm({
  action,
  confirmMessage,
  idName,
  idValue,
  buttonText,
  buttonClassName = "secondary-button",
  buttonStyle,
}: DeleteFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm(confirmMessage)) {
      e.preventDefault();
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} style={{ display: "contents" }}>
      <input type="hidden" name={idName} value={idValue} />
      <button className={buttonClassName} type="submit" style={buttonStyle}>
        {buttonText}
      </button>
    </form>
  );
}
