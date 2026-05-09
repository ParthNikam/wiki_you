type MarkdownMessageProps = {
  content: string;
  className?: string;
};

type CodeBlock = {
  html: string;
  key: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyInlineMarkdown(text: string) {
  let formatted = escapeHtml(text);

  formatted = formatted.replace(
    /`([^`]+)`/g,
    '<code class="rounded bg-black/10 px-1.5 py-0.5 font-mono text-[0.9em]">$1</code>'
  );
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  formatted = formatted.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer" class="underline underline-offset-2">$1</a>'
  );

  return formatted;
}

function renderMarkdownToHtml(markdown: string) {
  const codeBlocks: CodeBlock[] = [];
  let content = markdown.replace(/\r\n/g, "\n");

  content = content.replace(/```([\w-]*)\n([\s\S]*?)```/g, (_, language, code) => {
    const key = `__CODE_BLOCK_${codeBlocks.length}__`;
    const escapedCode = escapeHtml(String(code).trimEnd());
    const languageLabel = language
      ? `<div class="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/45">${escapeHtml(String(language))}</div>`
      : "";

    codeBlocks.push({
      key,
      html: `<pre class="no-scrollbar overflow-x-auto rounded-xl bg-black/30 px-4 py-3"><code class="font-mono text-[13px] leading-6">${escapedCode}</code></pre>`,
    });

    return `${languageLabel}${key}`;
  });

  const lines = content.split("\n");
  const html: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (!listItems.length) {
      return;
    }

    html.push(
      `<ul class="list-disc space-y-1 pl-5">${listItems
        .map((item) => `<li>${applyInlineMarkdown(item)}</li>`)
        .join("")}</ul>`
    );
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const headingClasses = [
        "",
        "text-2xl font-semibold",
        "text-xl font-semibold",
        "text-lg font-semibold",
        "text-base font-semibold",
        "text-sm font-semibold uppercase tracking-wide",
        "text-sm font-semibold uppercase tracking-wide",
      ];

      html.push(
        `<h${level} class="${headingClasses[level]}">${applyInlineMarkdown(
          headingMatch[2]
        )}</h${level}>`
      );
      continue;
    }

    const listMatch = line.match(/^[-*]\s+(.*)$/);
    if (listMatch) {
      listItems.push(listMatch[1]);
      continue;
    }

    flushList();

    if (line.startsWith("__CODE_BLOCK_")) {
      html.push(line);
      continue;
    }

    html.push(`<p>${applyInlineMarkdown(line)}</p>`);
  }

  flushList();

  let rendered = html.join("");

  for (const block of codeBlocks) {
    rendered = rendered.replace(block.key, block.html);
  }

  return rendered;
}

export function MarkdownMessage({
  content,
  className = "",
}: MarkdownMessageProps) {
  return (
    <div
      className={`space-y-3 break-words [&_p]:leading-7 [&_strong]:font-semibold ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }}
    />
  );
}
