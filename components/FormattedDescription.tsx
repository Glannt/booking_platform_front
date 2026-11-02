import React from "react";

interface FormattedDescriptionProps {
  description?: string | null;
  className?: string;
  paragraphClassName?: string;
  bulletClassName?: string;
}

/**
 * Parses and formats description text:
 * - Wraps ultra-long unbroken words with break-words and [overflow-wrap:anywhere]
 * - Converts lines starting with `-`, `*`, or `•` into standard <li> list items
 * - Renders paragraphs with clean line-height and spacing
 */
export function FormattedDescription({
  description,
  className = "",
  paragraphClassName = "",
  bulletClassName = "",
}: FormattedDescriptionProps) {
  if (!description) return null;

  // Clean raw HTML paragraph tags if present in plain string
  let normalized = description;
  if (normalized.includes("<p>") || normalized.includes("</p>") || normalized.includes("<br")) {
    normalized = normalized
      .replace(/<p>/gi, "")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .trim();
  }

  const rawLines = normalized.split(/\r?\n/);
  
  // Group lines into paragraphs and list blocks
  type Block =
    | { type: "paragraph"; text: string }
    | { type: "list"; items: string[] };

  const blocks: Block[] = [];
  let currentList: string[] = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Check if line starts with bullet indicator: -, *, •, or -item
    const bulletMatch = trimmed.match(/^[-*•]\s*(.*)$/);

    if (bulletMatch) {
      const itemText = bulletMatch[1].trim();
      if (itemText) {
        currentList.push(itemText);
      }
    } else {
      if (currentList.length > 0) {
        blocks.push({ type: "list", items: [...currentList] });
        currentList = [];
      }
      blocks.push({ type: "paragraph", text: trimmed });
    }
  }

  if (currentList.length > 0) {
    blocks.push({ type: "list", items: [...currentList] });
  }

  if (blocks.length === 0) return null;

  return (
    <div className={`space-y-2 break-words [overflow-wrap:anywhere] ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === "list") {
          return (
            <ul
              key={idx}
              className={`list-disc list-inside space-y-1 text-left my-1.5 ${bulletClassName}`}
            >
              {block.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="leading-relaxed break-words [overflow-wrap:anywhere]"
                >
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={idx}
            className={`leading-relaxed break-words [overflow-wrap:anywhere] ${paragraphClassName}`}
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
