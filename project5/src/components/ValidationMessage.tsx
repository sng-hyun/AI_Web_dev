interface ValidationMessageProps {
  message?: string;
  messageId: string;
}

export default function ValidationMessage({
  message,
  messageId,
}: ValidationMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p id={messageId} className="validation-message" role="alert">
      {message}
    </p>
  );
}
