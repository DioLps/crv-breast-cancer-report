const SHARE_EVENT_NAME = "share_click";

function emitShareEvent(detail) {
  const enriched = {
    event: SHARE_EVENT_NAME,
    timestamp: new Date().toISOString(),
    ...detail,
  };

  window.dispatchEvent(new CustomEvent(SHARE_EVENT_NAME, { detail: enriched }));

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(enriched);
  }
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = value;
  helper.setAttribute("readonly", "");
  helper.style.position = "absolute";
  helper.style.left = "-9999px";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  document.body.removeChild(helper);
}

function setShareMessage(button, message) {
  const panel = button.closest("[data-share-panel]");
  const feedback = panel?.querySelector("[data-share-status]");

  if (feedback) {
    feedback.textContent = message;
  }
}

function buildShareUrl(platform, payload) {
  const url = encodeURIComponent(payload.url);
  const text = encodeURIComponent(payload.text);

  switch (platform) {
    case "line":
      return `https://social-plugins.line.me/lineit/share?url=${url}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    default:
      return payload.url;
  }
}

async function handleShare(button) {
  const platform = button.dataset.sharePlatform;
  const lang = document.documentElement.lang || "und";
  const section = button.closest("section")?.id || "unknown";
  const payload = {
    platform,
    lang,
    section,
    text: button.dataset.shareText || document.title,
    url: window.location.href,
  };

  emitShareEvent(payload);

  if (platform === "native") {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          text: payload.text,
          url: payload.url,
        });
        setShareMessage(button, button.dataset.messageShared || "");
      } catch {
        setShareMessage(button, button.dataset.messageCancelled || "");
      }
      return;
    }

    await copyText(payload.url);
    setShareMessage(button, button.dataset.messageCopied || "");
    return;
  }

  if (platform === "copy") {
    await copyText(payload.url);
    setShareMessage(button, button.dataset.messageCopied || "");
    return;
  }

  const shareUrl = buildShareUrl(platform, payload);
  window.open(shareUrl, "_blank", "noopener,noreferrer,width=720,height=640");
  setShareMessage(button, button.dataset.messageOpened || "");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-share-platform]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await handleShare(button);
      } catch (error) {
        console.error("Share action failed", error);
        setShareMessage(button, button.dataset.messageError || "");
      }
    });
  });
});
