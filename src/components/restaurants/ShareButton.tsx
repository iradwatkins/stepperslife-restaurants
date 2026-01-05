"use client";

import { useState } from "react";
import { Share2, Link, Facebook, Twitter, MessageCircle, Mail, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  variant?: "button" | "icon";
  size?: "sm" | "md" | "lg";
}

export function ShareButton({
  title,
  text,
  url,
  variant = "button",
  size = "md",
}: ShareButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = text || title;

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const handleShare = async () => {
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or error - fall through to dropdown
      }
    }

    // Show dropdown for desktop
    setShowDropdown(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLinks = [
    {
      name: "Copy Link",
      icon: copied ? Check : Link,
      action: copyToClipboard,
      className: copied ? "text-success" : "",
    },
    {
      name: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    },
    {
      name: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`,
    },
  ];

  if (variant === "icon") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={handleShare}
          className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-white/80 dark:bg-card/80 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform text-muted-foreground dark:text-muted-foreground hover:text-primary`}
          aria-label="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-card rounded-lg shadow-xl border border dark:border py-2 min-w-[180px]">
              <div className="px-3 py-2 border-b border dark:border flex items-center justify-between">
                <span className="text-sm font-medium">Share</span>
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="text-muted-foreground hover:text-muted-foreground"
                  aria-label="Close share menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {shareLinks.map((link) => {
                const Icon = link.icon;
                if (link.action) {
                  return (
                    <button
                      type="button"
                      key={link.name}
                      onClick={link.action}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted dark:hover:bg-muted ${link.className || ""}`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.name}
                    </button>
                  );
                }
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted dark:hover:bg-muted"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </a>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button onClick={handleShare} variant="outline" size="sm">
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute left-0 top-full mt-2 z-50 bg-white dark:bg-card rounded-lg shadow-xl border border dark:border py-2 min-w-[180px]">
            <div className="px-3 py-2 border-b border dark:border flex items-center justify-between">
              <span className="text-sm font-medium">Share</span>
              <button
                type="button"
                onClick={() => setShowDropdown(false)}
                className="text-muted-foreground hover:text-muted-foreground"
                aria-label="Close share menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {shareLinks.map((link) => {
              const Icon = link.icon;
              if (link.action) {
                return (
                  <button
                    type="button"
                    key={link.name}
                    onClick={link.action}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted dark:hover:bg-muted ${link.className || ""}`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </button>
                );
              }
              return (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted dark:hover:bg-muted"
                  onClick={() => setShowDropdown(false)}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </a>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
