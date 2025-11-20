import { Attachments, Message, parse } from "cesr";
import { useEffect, useState } from "react";

export interface AppProps {
  text?: string;
}

interface BadgeProps {
  color: string;
  children: React.ReactNode;
}

function Badge({ color, children }: BadgeProps) {
  return (
    <span
      style={{
        backgroundColor: color,
        color: "white",
        fontSize: "11px",
        padding: "2px 6px",
        borderRadius: "4px",
      }}
    >
      {children}
    </span>
  );
}

interface MessageHeaderProps {
  message: Message;
  index: number;
}

function MessageHeader({ message, index }: MessageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "12px",
        flexWrap: "wrap",
        gap: "8px",
      }}
    >
      <Badge color="#3b82f6">Message {index + 1}</Badge>
      {message.body.payload.t && <Badge color="#8b5cf6">Type: {String(message.body.payload.t)}</Badge>}
      {message.body.payload.d && <Badge color="#f59e0b">Digest: {String(message.body.payload.d)}</Badge>}
      {message.body.payload.i && <Badge color="#ef4444">i: {String(message.body.payload.i)}</Badge>}
    </div>
  );
}

interface PayloadSectionProps {
  payload: Record<string, unknown>;
}

function PayloadSection({ payload }: PayloadSectionProps) {
  return (
    <div
      style={{
        backgroundColor: "#f1f5f9",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "16px",
      }}
    >
      <h3
        style={{
          margin: "0 0 8px 0",
          fontSize: "14px",
          fontWeight: "600",
          color: "#374151",
        }}
      >
        Payload
      </h3>
      <pre
        style={{
          margin: 0,
          fontSize: "13px",
          fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
          lineHeight: "1.4",
        }}
      >
        <code
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            display: "block",
            color: "#1e293b",
          }}
        >
          {JSON.stringify(payload, null, 2)}
        </code>
      </pre>
    </div>
  );
}

interface AttachmentListProps {
  attachments: Attachments;
  isExpanded: boolean;
  onToggle: () => void;
}

function AttachmentList({ attachments, isExpanded, onToggle }: AttachmentListProps) {
  const renderAttachmentValue = (value: any, idx: number) => {
    // If it's a simple string, render it directly
    if (typeof value === "string") {
      return (
        <div
          key={idx}
          style={{
            backgroundColor: "#fffbeb",
            border: "1px solid #fcd34d",
            borderRadius: "4px",
            padding: "6px 8px",
          }}
        >
          <code
            style={{
              fontSize: "11px",
              fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
              color: "#451a03",
              wordBreak: "break-all",
            }}
          >
            {value}
          </code>
        </div>
      );
    }

    // If it's an object or complex type, render as JSON
    return (
      <div
        key={idx}
        style={{
          backgroundColor: "#fffbeb",
          border: "1px solid #fcd34d",
          borderRadius: "4px",
          padding: "6px 8px",
        }}
      >
        <pre
          style={{
            margin: 0,
            fontSize: "11px",
            fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
            color: "#451a03",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    );
  };

  const renderAttachmentSection = (key: string, values: any[] | undefined) => {
    if (!values || values.length === 0) return null;

    return (
      <div
        key={key}
        style={{
          backgroundColor: "#fef3c7",
          border: "1px solid #fbbf24",
          borderRadius: "6px",
          padding: "12px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#92400e",
            marginBottom: "8px",
          }}
        >
          {key}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {values.map((value, idx) => renderAttachmentValue(value, idx))}
        </div>
      </div>
    );
  };

  const allAttachmentSections = [
    renderAttachmentSection("ControllerIdxSigs", attachments.ControllerIdxSigs),
    renderAttachmentSection("WitnessIdxSigs", attachments.WitnessIdxSigs),
    renderAttachmentSection("NonTransReceiptCouples", attachments.NonTransReceiptCouples),
    renderAttachmentSection("FirstSeenReplayCouples", attachments.FirstSeenReplayCouples),
    renderAttachmentSection("TransIdxSigGroups", attachments.TransIdxSigGroups),
    renderAttachmentSection("TransLastIdxSigGroups", attachments.TransLastIdxSigGroups),
    renderAttachmentSection("SealSourceCouples", attachments.SealSourceCouples),
    renderAttachmentSection("SealSourceTriples", attachments.SealSourceTriples),
    renderAttachmentSection("PathedMaterialCouples", attachments.PathedMaterialCouples),
  ].filter(Boolean);

  if (allAttachmentSections.length === 0) return null;

  return (
    <div>
      <button
        onClick={onToggle}
        style={{
          backgroundColor: "#10b981",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "8px 12px",
          fontSize: "12px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "background-color 0.2s ease",
          marginBottom: "12px",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = "#059669";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = "#10b981";
        }}
      >
        {isExpanded ? "Hide" : "Show"} Attachments
      </button>

      {isExpanded && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {allAttachmentSections}
        </div>
      )}
    </div>
  );
}

interface MessageCardProps {
  message: Message;
  index: number;
  isExpanded: boolean;
  onToggleAttachments: () => void;
}

function MessageCard({ message, index, isExpanded, onToggleAttachments }: MessageCardProps) {
  return (
    <li
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        marginBottom: "16px",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        transition: "box-shadow 0.2s ease",
      }}
    >
      <MessageHeader message={message} index={index} />
      <PayloadSection payload={message.body.payload} />
      <AttachmentList attachments={message.attachments} isExpanded={isExpanded} onToggle={onToggleAttachments} />
    </li>
  );
}

export function App(props: AppProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [showRawText, setShowRawText] = useState(false);

  async function startParse(text: string) {
    for await (const message of parse(text)) {
      setMessages((prevMessages) => [...prevMessages, message]);
    }
  }

  useEffect(() => {
    startParse(props.text);
  }, [props.text]);

  const downloadText = () => {
    if (!props.text) return;

    // Get filename from URL pathname, replace extension with .cesr
    const pathname = window.location.pathname;
    const filename =
      pathname === "/"
        ? "cesr-data.cesr"
        : pathname
            .split("/")
            .pop()
            ?.replace(/\.[^/.]+$/, "") + ".cesr" || "cesr-data.cesr";

    const blob = new Blob([props.text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleAttachments = (index: number) => {
    const newExpanded = new Set(expandedMessages);
    if (expandedMessages.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedMessages(newExpanded);
  };

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <h1
        style={{
          color: "#1e293b",
          fontSize: "24px",
          fontWeight: "600",
          marginBottom: "12px",
          textAlign: "center",
        }}
      >
        CESR Messages
      </h1>

      <div
        style={{
          textAlign: "center",
          marginBottom: "24px",
          fontSize: "14px",
          color: "#64748b",
        }}
      >
        <div style={{ marginBottom: "4px" }}>
          Powered by{" "}
          <a
            href="https://github.com/lenkan/cesr-js"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#3b82f6",
              textDecoration: "none",
            }}
          >
            https://github.com/lenkan/cesr-js
          </a>
        </div>
        <div>
          Source code available at{" "}
          <a
            href="https://github.com/lenkan/cesr-viewer"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#3b82f6",
              textDecoration: "none",
            }}
          >
            https://github.com/lenkan/cesr-viewer
          </a>
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          marginBottom: "24px",
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={downloadText}
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#2563eb";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#3b82f6";
          }}
        >
          📥 Download CESR
        </button>

        <button
          onClick={() => setShowRawText(!showRawText)}
          style={{
            backgroundColor: showRawText ? "#ef4444" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = showRawText ? "#dc2626" : "#059669";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = showRawText ? "#ef4444" : "#10b981";
          }}
        >
          {showRawText ? "📄 Show Pretty View" : "📝 Show Raw Text"}
        </button>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {showRawText ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                fontSize: "16px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Raw CESR Text
            </h3>
            <pre
              style={{
                margin: 0,
                fontSize: "12px",
                fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                lineHeight: "1.4",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                padding: "16px",
                overflow: "auto",
                maxHeight: "500px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              <code style={{ color: "#1e293b" }}>{props.text || "No CESR data available"}</code>
            </pre>
          </div>
        ) : (
          <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
            {messages.map((message, index) => (
              <MessageCard
                key={index}
                message={message}
                index={index}
                isExpanded={expandedMessages.has(index)}
                onToggleAttachments={() => toggleAttachments(index)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
