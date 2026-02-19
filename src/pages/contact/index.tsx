import { motion } from "framer-motion";
import { useCallback } from "react";
import { Helmet } from "react-helmet-async";

import { useContactFeedback } from "@/shared/lib/useContactFeedback";
import { toast } from "@/shared/lib/toast";

const EMAIL = "hello@raven.kr";
const GITHUB_URL = "https://github.com";
const LINKEDIN_URL = "https://linkedin.com";

export function ContactPage() {
  const { copyToClipboard } = useContactFeedback();

  const handleEmailClick = useCallback(async () => {
    const ok = await copyToClipboard(EMAIL);
    if (ok) {
      toast.success("이메일 주소가 복사되었습니다.");
    } else {
      toast.info("선택하여 복사하거나, 메일 앱으로 보내주세요.", {
        description: EMAIL,
      });
    }
  }, [copyToClipboard]);

  const handleExternalClick = useCallback((url: string, label: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`${label}(으)로 이동했습니다.`);
  }, []);

  return (
    <>
      <Helmet>
        <title>Contact · raven</title>
        <meta name="description" content="연락처." />
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-8"
        >
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Contact
          </h1>
          <p className="text-muted-foreground">
            이메일 또는 링크를 클릭하면 복사되거나 새 탭에서 열립니다.
          </p>
          <ul className="space-y-4">
            <li>
              <button
                type="button"
                onClick={handleEmailClick}
                className="rounded text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {EMAIL}
              </button>
            </li>
            <li>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleExternalClick(GITHUB_URL, "GitHub")}
                className="rounded text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleExternalClick(LINKEDIN_URL, "LinkedIn")}
                className="rounded text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </motion.section>
      </div>
    </>
  );
}
