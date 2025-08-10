"use client";

import React from "react";
import { useTheme } from "next-themes";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Cpu,
  FileUp,
  Globe,
  LinkIcon,
  Loader2,
  Mail,
  Moon,
  Phone,
  Rocket,
  Sparkles,
  SunMedium,
  User2,
  TriangleAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Types that match the FastAPI contract.
 */
type SocialLinks = {
  linkedin?: string | null;
  github?: string | null;
  twitter?: string | null;
};

type Education = {
  degree: string;
  institution: string;
  years: string;
};

type Experience = {
  job_title: string;
  company: string;
  duration: string;
  description: string;
};

type Project = {
  name?: string;
  description?: string;
  link?: string;
};

type Resume = {
  name: string;
  email: string;
  phone: string;
  bio: string;
  address?: string | null;
  linkedin?: string | null;
  github?: string | null;
  website?: string | null;
  social_links?: SocialLinks;
  education: Education[];
  experience: Experience[];
  skills: string[];
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  resume_score?: number | null;
  ats_friendly?: boolean | null;
  ats_issues?: string[];
  missing_skills?: string[];
  highlights?: string[];
  suggested_roles?: string[];
  projects?: Project[];
};

type ApiResponse = {
  status: string;
  content: {
    text: string;
    file_type: string;
    filename: string;
    structured: Resume;
  };
};

/**
 * A small hook to animate elements when they enter the viewport.
 */
function useRevealOnView(selector: string, rootMargin = "0px 0px -10% 0px") {
  React.useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(selector);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-4");
          }
        });
      },
      { rootMargin, threshold: 0.1 }
    );

    elements.forEach((el) => {
      el.classList.add(
        "opacity-0",
        "translate-y-4",
        "transition",
        "duration-700"
      );
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [selector, rootMargin]);
}

/**
 * Neon circular progress gauge for resume_score
 */
function NeonCircularGauge({
  value = 0,
  size = 140,
  stroke = 12,
  className,
}: {
  value?: number | null;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Number(value ?? 0)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        "drop-shadow-[0_0_6px_rgba(34,211,238,0.45)]",
        className
      )}
      style={{ width: size, height: size }}
      aria-label="Resume Score"
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        <defs>
          <linearGradient id="neonGauge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(148,163,184,0.2)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#neonGauge)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
          className="drop-shadow-[0_0_18px_rgba(139,92,246,0.55)] transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center rotate-0">
        <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
          {Math.round(pct)}
        </div>
        <div className="text-xs text-muted-foreground">Score</div>
      </div>
    </div>
  );
}

/**
 * A soft neon bordered container
 */
function NeonPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-b from-background/40 to-background/80",
        "border-cyan-400/30 dark:border-cyan-400/30",
        "shadow-[0_0_24px_rgba(34,211,238,0.10)] hover:shadow-[0_0_32px_rgba(139,92,246,0.25)] transition-shadow",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Render the parsed resume in rich, collapsible sections.
 */
function ResumeResults({ resume }: { resume: Resume }) {
  const hasAnySocial =
    resume.linkedin ||
    resume.github ||
    resume.website ||
    (resume.social_links &&
      (resume.social_links.linkedin ||
        resume.social_links.github ||
        resume.social_links.twitter));

  const infoRow = (
    icon: React.ReactNode,
    text?: string | null,
    href?: string
  ) => {
    if (!text) return null;
    const content = <span className="truncate">{text}</span>;
    return (
      <div className="flex items-center gap-2 text-[14px] sm:text-sm text-muted-foreground">
        {icon}
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="hover:underline text-foreground truncate"
          >
            {content}
          </a>
        ) : (
          content
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top summary */}
      <NeonPanel className="p-4 ">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User2 className="h-5 w-5 text-cyan-400" />
              <h3 className="text-xl font-semibold">
                {resume.name || "Unnamed Candidate"}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-2">
              {infoRow(
                <Mail className="h-4 w-4 text-purple-400" />,
                resume.email,
                `mailto:${resume.email}`
              )}
              {infoRow(
                <Phone className="h-4 w-4 text-purple-400" />,
                resume.phone,
                `tel:${resume.phone}`
              )}
              {infoRow(
                <img
                  src="/linkedin.svg"
                  alt="Linkedin"
                  className="h-5 w-5 max-w-min"
                />,
                resume.linkedin ?? resume.social_links?.linkedin ?? null,
                (resume.linkedin ?? resume.social_links?.linkedin) || undefined
              )}
              {infoRow(
                <div className="h-4 w-4 text-purple-400">
                  <img
                    src="/github.svg"
                    className="h-5 w-5 max-w-min"
                    alt="Github"
                  />
                </div>,
                resume.github ?? resume.social_links?.github ?? null,
                (resume.github ?? resume.social_links?.github) || undefined
              )}
              {infoRow(
                <Globe className="h-4 w-4 text-purple-400" />,
                resume.website ?? null,
                resume.website || undefined
              )}
              {resume.address
                ? infoRow(
                    <LinkIcon className="h-4 w-4 text-purple-400" />,
                    resume.address
                  )
                : null}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-center">
              <NeonCircularGauge value={resume.resume_score ?? 0} />
            </div>
            {typeof resume.ats_friendly === "boolean" && (
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm border",
                    resume.ats_friendly
                      ? "border-emerald-400/40 text-emerald-400 bg-emerald-500/10"
                      : "border-red-400/40 text-red-400 bg-red-500/10"
                  )}
                >
                  {resume.ats_friendly ? (
                    <>
                      <ShieldCheck className="h-6 w-6 sm:h-4 sm:w-4" />
                      <span>ATS Friendly</span>
                    </>
                  ) : (
                    <>
                      <ShieldX className="h-4 w-4" />
                      <span>Not ATS Friendly</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {resume.bio && (
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {resume.bio}
          </p>
        )}
      </NeonPanel>

      {/* Highlights and Suggested Roles */}
      {resume.highlights?.length || resume.suggested_roles?.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {resume.highlights?.length ? (
            <NeonPanel className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <h4 className="text-lg font-semibold">Highlights</h4>
              </div>
              <ul className="grid gap-2">
                {resume.highlights?.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-1 text-purple-400" />
                    <span className="w-fit md:text-sm text-md">{h}</span>
                  </li>
                ))}
              </ul>
            </NeonPanel>
          ) : null}

          {resume.suggested_roles?.length ? (
            <NeonPanel className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="h-5 w-5 text-cyan-400" />
                <h4 className="text-lg font-semibold">Suggested Roles</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {resume.suggested_roles.map((r, i) => (
                  <Badge
                    key={i}
                    className="bg-gradient-to-r from-cyan-600 to-purple-600 text-white border-0 shadow-[0_0_14px_rgba(139,92,246,0.45)]"
                  >
                    {r}
                  </Badge>
                ))}
              </div>
            </NeonPanel>
          ) : null}
        </div>
      ) : null}

      {/* Accordion sections */}
      <Accordion type="multiple" className="space-y-4">
        {/* Skills */}
        {resume.skills?.length ? (
          <AccordionItem value="skills" className="border rounded-xl px-4">
            <AccordionTrigger className="text-base font-semibold">
              Skills
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {resume.skills.map((s, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="justify-start gap-2 border-cyan-400/40 dark:border-cyan-400/40 text-foreground/90 bg-cyan-400/5"
                  >
                    <Check className="h-3.5 w-3.5 text-cyan-400" />
                    {s}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : null}

        {/* Education */}
        {resume.education?.length ? (
          <AccordionItem value="education" className="border rounded-xl px-4">
            <AccordionTrigger className="text-base font-semibold">
              Education
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                {resume.education.map((e, i) => (
                  <Card key={i} className="border-cyan-400/30 bg-card/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{e.degree}</CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {e.institution}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        {e.years}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : null}

        {/* Experience */}
        {resume.experience?.length ? (
          <AccordionItem value="experience" className="border rounded-xl px-4">
            <AccordionTrigger className="text-base font-semibold">
              Experience
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                {resume.experience.map((x, i) => (
                  <Card key={i} className="border-purple-400/30 bg-card/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{x.job_title}</CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {x.company}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>{x.duration}</span>
                      </div>
                      {x.description && (
                        <p className="text-sm leading-6">{x.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : null}

        {/* Projects */}
        {resume.projects?.length ? (
          <AccordionItem value="projects" className="border rounded-xl px-4">
            <AccordionTrigger className="text-base font-semibold">
              Projects
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 md:grid-cols-2">
                {resume.projects.map((p, i) => (
                  <Card key={i} className="border-cyan-400/30 bg-card/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {p.name || "Project"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {p.description && (
                        <p className="text-sm text-muted-foreground">
                          {p.description}
                        </p>
                      )}
                      {p.link && (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:underline"
                        >
                          <Globe className="h-4 w-4" />
                          Visit
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : null}

        {/* Strengths / Weaknesses / Recommendations */}
        {resume.strengths?.length ||
        resume.weaknesses?.length ||
        resume.recommendations?.length ? (
          <AccordionItem value="insights" className="border rounded-xl px-4">
            <AccordionTrigger className="text-base font-semibold">
              Insights
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resume.strengths?.length ? (
                  <NeonPanel className="p-4">
                    <h5 className="font-semibold mb-2 text-emerald-400">
                      Strengths
                    </h5>
                    <ul className="grid gap-2 text-sm">
                      {resume.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 mt-0.5 text-emerald-400" />
                          <span className="w-fit">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </NeonPanel>
                ) : null}

                {resume.weaknesses?.length ? (
                  <NeonPanel className="p-4">
                    <h5 className="font-semibold mb-2 text-amber-400">
                      Weaknesses
                    </h5>
                    <ul className="grid gap-2 text-sm">
                      {resume.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <TriangleAlert className="h-4 w-4 mt-0.5 text-amber-400" />
                          <span className="w-fit">{w}</span>
                        </li>
                      ))}
                    </ul>
                  </NeonPanel>
                ) : null}

                {resume.recommendations?.length ? (
                  <NeonPanel className="p-4">
                    <h5 className="font-semibold mb-2 text-cyan-400">
                      Recommendations
                    </h5>
                    <ul className="grid gap-2 text-sm">
                      {resume.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-0.5 text-cyan-400" />
                          <span className="w-fit">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </NeonPanel>
                ) : null}
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : null}

        {/* ATS Issues and Missing Skills */}
        {resume.ats_issues?.length || resume.missing_skills?.length ? (
          <AccordionItem value="ats" className="border rounded-xl px-4">
            <AccordionTrigger className="text-base font-semibold">
              ATS & Gaps
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resume.ats_issues?.length ? (
                  <NeonPanel className="p-4">
                    <h5 className="font-semibold mb-2 text-red-400">
                      ATS Issues
                    </h5>
                    <ul className="grid gap-2 text-sm">
                      {resume.ats_issues.map((a, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <TriangleAlert className="h-4 w-4 mt-0.5 text-red-400" />
                          <span className="w-fit">{a}</span>
                        </li>
                      ))}
                    </ul>
                  </NeonPanel>
                ) : null}

                {resume.missing_skills?.length ? (
                  <NeonPanel className="p-4">
                    <h5 className="font-semibold mb-2 text-fuchsia-400">
                      Missing Skills
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {resume.missing_skills.map((m, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="border-fuchsia-400/40 text-foreground/90 bg-fuchsia-400/10"
                        >
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </NeonPanel>
                ) : null}
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : null}
      </Accordion>
    </div>
  );
}

/**
 * Main Page Component (SPA)
 */
export default function Page() {
  const { setTheme, resolvedTheme } = useTheme();
  const uploadRef = React.useRef<HTMLDivElement | null>(null);
  const howitworksRef = React.useRef<HTMLDivElement | null>(null);
  useRevealOnView('[data-reveal="true"]');

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [file, setFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [response, setResponse] = React.useState<ApiResponse | null>(null);

  const maxSize = 5 * 1024 * 1024; // 5MB
  const onDrop = React.useCallback((accepted: File[], rejected: any[]) => {
    setApiError(null);
    setResponse(null);

    if (rejected && rejected.length) {
      const first = rejected[0];
      if (first?.errors?.length) {
        const firstError = first.errors[0];
        if (firstError.code === "file-invalid-type") {
          setFileError("File type must be one of: .pdf, .docx, .doc");
        } else if (firstError.code === "file-too-large") {
          setFileError("File size exceeds 5MB.");
        } else {
          setFileError(firstError.message || "Invalid file.");
        }
      } else {
        setFileError("Invalid file.");
      }
      setFile(null);
      return;
    }

    const f = accepted[0];
    if (!f) return;
    if (f.size > maxSize) {
      setFileError("File size exceeds 5MB.");
      setFile(null);
      return;
    }

    setFileError(null);
    setFile(f);
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    isDragAccept,
  } = useDropzone({
    onDrop,
    multiple: false,
    maxSize,
    accept: {
      "application/pdf": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [],
      "application/msword": [],
    },
  });

  const handleStart = async () => {
    if (!file) return;
    setLoading(true);
    setApiError(null);
    setResponse(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await axios.post<ApiResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/parse-resume`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("eapi response", data);
      setResponse(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "An unexpected error occurred while parsing.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const scrollToWorks = () => {
    howitworksRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Default to dark look via a subtle gradient canvas background imitation
  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(125%_125%_at_50%_10%,#0b1220_10%,#0b1220_25%,#121826_45%,#121826_60%,#101827_100%)] dark:bg-[radial-gradient(125%_125%_at_50%_10%,#0b1220_10%,#0b1220_25%,#121826_45%,#121826_60%,#101827_100%)]">
      {/* Decorative glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute top-48 -right-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-[0_0_18px_rgba(139,92,246,0.55)]" />
              <span className="text-xl md:text-2xl font-extrabold text-foreground drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                Resume Nova AI
              </span>
            </div>

            {/* <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                <button
                  onClick={scrollToUpload}
                  className="hover:text-foreground transition"
                >
                  Upload
                </button>
                <button
                  // href="#how-it-works"
                  onClick={scrollToWorks}
                  className="hover:text-foreground transition"
                >
                  How It Works
                </button>
              </nav>
              <div className="flex items-center gap-2">
                <SunMedium className="h-4 w-4 text-amber-300" />
                <Switch
                  checked={mounted && resolvedTheme === "dark"}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
                  }
                  aria-label="Toggle dark mode"
                />
                <Moon className="h-4 w-4 text-cyan-300" />
              </div>
            </div> */}
          </div>
        </div>
      </header>

      {/* Banner / Hero */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div data-reveal="true">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                AI-Powered Resume Insights
              </div>
              <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400">
                  Unlock Your Resume&apos;s Potential
                </span>
                <br />
                with AI
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-prose">
                Upload your resume and get structured insights in seconds.
                Discover strengths, gaps, and ATS compatibility—then act on
                tailored recommendations.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  onClick={scrollToUpload}
                  className={cn(
                    "group bg-gradient-to-r from-cyan-500 to-purple-600 text-white",
                    "hover:shadow-[0_0_24px_rgba(0,212,255,0.45)] border-0"
                  )}
                  size="lg"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center text-sm text-cyan-300 hover:text-cyan-200 transition"
                >
                  Learn how it works
                </a>
              </div>
            </div>

            <div className="relative" data-reveal="true" aria-hidden="true">
              <div className="aspect-[3/2] w-full rounded-2xl border border-purple-400/30 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent shadow-[0_0_42px_rgba(139,92,246,0.35)]">
                <img
                  src="/bg-image.png"
                  className="h-full w-full object-contain border-0 border-green-500"
                  alt="Banner iamge"
                />
              </div>
              {/* <div className="absolute inset-0 animate-pulse pointer-events-none rounded-2xl border border-white/5" /> */}
            </div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section ref={uploadRef} className="scroll-mt-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-8">
          <NeonPanel className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Upload your resume</h2>
                <p className="text-sm text-muted-foreground">
                  Drag &amp; drop a PDF or DOCX, or click to choose a file (max
                  5MB).
                </p>
              </div>

              {/* <div className="flex items-center gap-2 rounded-full border border-cyan-400/30 px-3 py-1 text-xs text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5 text-cyan-300" />
                <span>
                  Privacy-first: files are only sent to your local backend.
                </span>
              </div> */}
            </div>

            <div
              {...getRootProps()}
              className={cn(
                "mt-5 rounded-2xl border-2 border-dashed p-8 md:p-10 text-center cursor-pointer transition",
                "bg-background/60",
                isDragActive
                  ? "border-cyan-400/80 shadow-[0_0_28px_rgba(34,211,238,0.35)]"
                  : "border-cyan-400/30 hover:border-cyan-400/60",
                isDragReject ? "border-red-400/60" : ""
              )}
            >
              <input {...getInputProps()} aria-label="Resume File Dropzone" />
              <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-xl border border-cyan-400/40 bg-cyan-400/10 flex items-center justify-center">
                  <FileUp className="h-6 w-6 text-cyan-300" />
                </div>
                {isDragActive ? (
                  <p className="text-sm">Drop the file here...</p>
                ) : (
                  <>
                    <p className="text-sm">
                      Drag &amp; drop your PDF/DOCX resume here, or click to
                      browse.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Accepted: .pdf, .docx, .doc • Max size: 5MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Selected file details */}
            {file && (
              <div className="mt-4 flex items-center flex-wrap gap-1 justify-between rounded-lg border border-cyan-400/30 bg-cyan-400/5 p-3">
                <div className="truncate">
                  <div className="text-xs font-medium">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <Badge className="bg-cyan-600 border-0 text-white">Ready</Badge>
              </div>
            )}

            {/* Validation error */}
            {fileError && (
              <Alert className="mt-4 border-2 border-red-400/50 bg-red-500/10">
                <AlertTitle className="flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4 text-red-400" />
                  Invalid file
                </AlertTitle>
                <AlertDescription className="text-sm">
                  {fileError}
                </AlertDescription>
              </Alert>
            )}

            {/* Start Button */}
            <div className="mt-6 flex items-center justify-end">
              <Button
                onClick={handleStart}
                disabled={!file || loading}
                className={cn(
                  "group bg-gradient-to-r from-cyan-500 to-purple-600 text-white",
                  "hover:shadow-[0_0_20px_rgba(0,212,255,0.5)] border-0 disabled:opacity-60"
                )}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Parsing...
                  </>
                ) : (
                  <>
                    Start Parsing
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </div>
          </NeonPanel>

          {/* API Error */}
          {apiError && (
            <Alert className="mt-6 border-2 border-red-400/50 bg-red-500/20">
              <AlertTitle className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 text-red-300" />
                Error
              </AlertTitle>
              <AlertDescription className="text-sm">
                {apiError}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State (enhanced visual) */}
          {loading && (
            <div className="mt-8 flex items-center justify-center">
              <div className="relative h-20 w-20">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-400/30" />
                <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent border-b-cyan-400 border-l-purple-400 animate-spin" />
              </div>
            </div>
          )}

          {/* Results */}
          {response?.content?.structured && !loading && (
            <div className="mt-8" data-reveal="true">
              <ResumeResults resume={response.content.structured} />
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" ref={howitworksRef} className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl" data-reveal="true">
            <h2 className="text-2xl sm:text-3xl font-bold">How It Works</h2>
            <p className="mt-2 text-muted-foreground">
              From upload to insights in four simple steps.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <NeonPanel className="p-5" data-reveal="true">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center">
                  <FileUp className="h-5 w-5 text-cyan-300" />
                </div>
                <h3 className="font-semibold">Upload Resume</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Drop your PDF or DOCX resume into the upload area.
              </p>
            </NeonPanel>

            <NeonPanel className="p-5" data-reveal="true">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-purple-500/15 border border-purple-400/30 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-purple-300" />
                </div>
                <h3 className="font-semibold">AI Parsing</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Our AI analyzes your resume and extracts structured data.
              </p>
            </NeonPanel>

            <NeonPanel className="p-5" data-reveal="true">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-cyan-300" />
                </div>
                <h3 className="font-semibold">Detailed Insights</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                View strengths, weaknesses, ATS compatibility, and more.
              </p>
            </NeonPanel>

            <NeonPanel className="p-5" data-reveal="true">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-purple-500/15 border border-purple-400/30 flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-purple-300" />
                </div>
                <h3 className="font-semibold">Take Action</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Use recommendations to improve your resume and apply for
                suggested roles.
              </p>
            </NeonPanel>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex flex-col items-center max-w-6xl px-4 sm:px-6 py-8 text-xs text-muted-foreground">
          <span> Resume Nova AI</span>
          <span> &copy; 2025 All Rights Reserved</span>
        </div>
      </footer>
    </main>
  );
}
